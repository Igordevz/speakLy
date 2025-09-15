import Fastify, { type FastifyRequest, type FastifyReply } from 'fastify';
import jwt, { type JWT } from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import { appRoutes } from '@server/routes';

declare module 'fastify' {
  export interface FastifyInstance {
    jwt: JWT;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
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

fastify.register(fastifyCors, {
  origin: "*",
});

fastify.register(jwt, {
  secret: process.env.JWT_SECRET!,
});

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
    await fastify.listen({ port: 3333, host: '0.0.0.0' });
    console.log('Server listening on port 3333');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();