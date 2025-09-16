import ValidateToken from "@server/controllers/user/validate-token";
import MagicLinkAuth from "@server/controllers/user/magic-link-auth";
import RequestUploadUrl from "@server/controllers/audio/request-upload-url";
import ProcessUploadedAudio from "@server/controllers/audio/process-uploaded-audio"; 
import type { FastifyInstance } from "fastify";
import GetUser from "@server/controllers/user/get-user";

export async function appRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    return { hello: 'world' };
  });

  app.post("/auth/magic-link", MagicLinkAuth)
  app.get("/token/:token", ValidateToken)
  app.get("/user", GetUser)

  // Protected route for requesting R2 upload URL
  app.post("/audio/upload-url", RequestUploadUrl)

  // Protected route for processing uploaded audio
  app.post("/audio/process-uploaded", ProcessUploadedAudio)
}
