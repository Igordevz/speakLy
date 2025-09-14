import { prisma } from "@server/lib/prisma";
import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

export default async function ValidateToken(req: FastifyRequest, reply: FastifyReply) {

  const tokenSchema = z.object({
    token: z.string(),
  });

  const { token } = tokenSchema.parse(req.params);

  const user = await prisma.user.findFirst({
    where: {
      magicToken: token,
    },
  });

  if (!user) {
    throw new Error("Invalid token");
  }

  if (user.magicTokenExpiresAt && user.magicTokenExpiresAt < new Date()) {
    throw new Error("Token expired");
  }

  // Mark email as verified and invalidate the token
  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      magicToken: null,
      magicTokenExpiresAt: null,
    },
  });

  const jwtToken = await reply.jwtSign({ sub: user.id }, { expiresIn: '7d' });

  reply.send({ token: jwtToken });
}