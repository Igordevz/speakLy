import { prisma } from "@server/lib/prisma";
import { getSignedPutUrl } from "@server/lib/r2";
import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
// import { transcribeAudio, summarizeText } from "@server/lib/openai"; // Remove OpenAI imports

export default async function RequestUploadUrl(req: FastifyRequest, reply: FastifyReply) {
  const uploadSchema = z.object({
    name: z.string().optional(),
    contentType: z.string().startsWith("audio/"), 
  });

  const { name, contentType } = uploadSchema.parse(req.body);

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

  // Generate a unique key for the R2 object
  const reference = `${userId}/${Date.now()}_${name || 'audio'}.${contentType.split('/')[1]}`;

  // Create Audio record in DB with initial data
  const audio = await prisma.audio.create({
    data: {
      userId: userId,
      reference: reference, // Ensure reference is saved
      name: name,
      // text_brute and resume will be updated later
    },
  });

  // Get a pre-signed URL for uploading to R2
  const signedUrl = await getSignedPutUrl(reference, contentType);

  return reply.send({
    uploadUrl: signedUrl,
    audioId: audio.id,
    reference: audio.reference,
  });
}