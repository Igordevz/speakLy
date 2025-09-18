import { prisma } from "@server/lib/prisma";
import { transcribeAudio, summarizeText } from "@server/lib/gemini";
import { getSignedGetUrl } from "@server/lib/r2";
import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

export default async function ProcessUploadedAudio(req: FastifyRequest, reply: FastifyReply) {
  const paramsSchema = z.object({
    audioId: z.string().cuid(),
  });

  const { audioId } = paramsSchema.parse(req.params);

  const jwtToken = req.headers['jwt'] as string | undefined;

  if (!jwtToken) {
    reply.status(401).send({ error: "Unauthorized: JWT token missing." });
    return;
  }

  let decodedPayload: { sub: string };
  try {
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

  const audioRecord = await prisma.audio.findUnique({
    where: { id: audioId },
  });

  if (!audioRecord || audioRecord.userId !== userId) {
    throw new Error("Audio record not found or unauthorized.");
  }

  const audioUrl = await getSignedGetUrl(audioRecord?.reference);

  console.log(`[R2] Signed Audio URL for Gemini: ${audioUrl}`);

  const transcribedText = await transcribeAudio(audioUrl);

  const summarizedText = await summarizeText(transcribedText);

  const audio = await prisma.audio.update({
    where: { id: audioId },
    data: {
      text_brute: transcribedText,
      resume: summarizedText,
    },
  });

  return reply.send({
    success: true,
    audio:  audio,
    message: "Audio processed successfully.",
  });
}