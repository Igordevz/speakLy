import { prisma } from '@server/lib/prisma';
import Fastify, { type FastifyRequest } from 'fastify';
import { appRoutes } from '@server/routes';
import type   { JWT } from '@fastify/jwt';
import  jwt  from '@fastify/jwt';
import type { FastifyReply } from 'fastify/types/reply';

declare module 'fastify' {
  export interface FastifyInstance {
    jwt: JWT;
    authenticate: any; // Add authenticate method to FastifyInstance
  }
  interface FastifyRequest {
    user: {
      sub: string;
    };
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      sub: string;
    };
  }
}

const fastify = Fastify({
  logger: false,
});

fastify.register(jwt, {
  secret: process.env.JWT_SECRET!,
});

// Authentication preHandler
fastify.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

fastify.register(appRoutes);

const start = async () => {
  try {
    await fastify.listen({ port: 3333 });
    console.log("this application run");
    
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();