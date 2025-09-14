import { prisma } from "@server/lib/prisma";
import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { randomBytes } from 'crypto';

export default async function MagicLinkAuth(req: FastifyRequest, reply: FastifyReply) {
  const authSchema = z.object({
    email: z.string().email(),
  });

  const { email } = authSchema.parse(req.body);

  let user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  const magicToken = randomBytes(20).toString('hex');
  const magicTokenExpiresAt = new Date(Date.now() + 1 * 60 * 1000); // 15 minutes

  if (user) {
  
    user = await prisma.user.update({
      where: {
        email,
      },
      data: {
        magicToken: magicToken,
        magicTokenExpiresAt: magicTokenExpiresAt,
      },
    });
  } else {
    // User does not exist, create new user
    user = await prisma.user.create({
      data: {
        email,
        magicToken: magicToken,
        magicTokenExpiresAt: magicTokenExpiresAt,
      },
    });
  }

  if (user?.id) {
    console.log(`🧞‍♀️ Magic link sent to ${user.email}: http://localhost:3333/token/${magicToken}`);
    return reply.send({
      success: true,
      message: "Magic link sent. Check your console for the link."
    });
  } else {
    throw new Error("system error");
  }
}
