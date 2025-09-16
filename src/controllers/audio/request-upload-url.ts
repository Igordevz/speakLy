import { prisma } from "@server/lib/prisma";
import { getSignedPutUrl } from "@server/lib/r2";
import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

export default async function RequestUploadUrl(req: FastifyRequest, reply: FastifyReply) {
  const uploadSchema = z.object({
    name: z.string().optional(),
    contentType: z.string().startsWith("audio/"),
    fileSize: z.string().optional(), 
  });

  const { name, contentType, fileSize } = uploadSchema.parse(req.body); 

  // Get JWT from custom 'jwt' header
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

  // Generate a unique key for the R2 object
  const reference = `${userId}/${Date.now()}_${name || 'audio'}.${contentType.split('/')[1]}`;

  // Create Audio record in DB with initial data
  const audio = await prisma.audio.create({
    data: {
      userId: userId,
      reference: reference, 
      name: name,
      file_size: fileSize, // Added fileSize to data
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