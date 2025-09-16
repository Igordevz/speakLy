import { prisma } from "@server/lib/prisma";
import type { FastifyReply, FastifyRequest } from "fastify";

export default async function GetUser(request: FastifyRequest, reply: FastifyReply) {
  const jwtToken = request.headers['jwt'] as string | undefined;

  if (!jwtToken) {
    reply.status(401).send({ error: "Unauthorized: JWT token missing." });
    return;
  }

  let decodedPayload: { sub: string };
  try {
    decodedPayload = request.server.jwt.decode(jwtToken) as { sub: string };
  } catch (error) {
    reply.status(401).send({ error: "Unauthorized: Invalid JWT token." });
    return;
  }

  if (!decodedPayload || !decodedPayload.sub) {
    reply.status(401).send({ error: "Unauthorized: Invalid JWT payload." });
    return;
  }

  const userId = decodedPayload.sub;

  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
     include: {
       Audio: true
     }
  })

  if (!user) {
    reply.status(404).send({ error: "User not found." });
    return;
  }

  return reply.send({ user });
}