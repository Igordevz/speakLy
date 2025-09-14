import { prisma } from "@server/lib/prisma";
import { transcribeAudio, summarizeText } from "@server/lib/gemini"; 
import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";



export default async function ProcessUploadedAudio(req: FastifyRequest, reply: FastifyReply) {
  const processSchema = z.object({
    audioId: z.string(),
    reference: z.string(),
    contentType: z.string().startsWith("audio/"), 
  });

  const { audioId, reference, contentType } = processSchema.parse(req.body);

  // Get JWT from custom 'jwt' header
  const jwtToken = req.headers['jwt'] as string | undefined;

  if (!jwtToken) {
    reply.status(401).send({ error: "Unauthorized: JWT token missing." });
    return;
  }

  let decodedPayload: { sub: string };
  try {
    // Decode the token using Fastify's JWT plugin instance
    decodedPayload = req.server.jwt.decode(jwtToken) as { sub: string };
  } catch (error) {
    reply.status(401).send({ error: "Unauthorized: Invalid JWT token." });
    return;
  }

  if (!decodedPayload || !decodedPayload.sub) {
    reply.status(401).send({ error: "Unauthorized: Invalid JWT payload." });
    return;
  }

  const userId = decodedPayload.sub;

  // Verify that the audio record exists and belongs to the authenticated user
  const audioRecord = await prisma.audio.findUnique({
    where: { id: audioId },
  });

  if (!audioRecord || audioRecord.userId !== userId) { // Use userId from decoded JWT
    throw new Error("Audio record not found or unauthorized.");
  }

  // Construct the public URL for the audio in R2
  const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN!;
  const publicAudioUrl = `${R2_PUBLIC_DOMAIN}/${reference}`;

  console.log(`[R2] Public Audio URL for AssemblyAI: ${publicAudioUrl}`); // Log the URL

  // Transcribe audio using AssemblyAI
  const transcribedText = await transcribeAudio(publicAudioUrl); // Pass the public URL

  // Summarize text using Gemini GPT
  const summarizedText = await summarizeText(transcribedText);

  // Update Audio record with transcribed and summarized text
  await prisma.audio.update({
    where: { id: audioId },
    data: {
      text_brute: transcribedText,
      resume: summarizedText,
    },
  });

  return reply.send({
    success: true,
    message: "Audio processed successfully.",
    audioId: audioId,
    text_brute: transcribedText,
    resume: summarizedText,
  });
}