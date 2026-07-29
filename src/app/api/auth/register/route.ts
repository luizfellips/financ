import { withApiHandler } from "@/server/http/handler";
import { authController } from "@/server/controllers/auth.controller";

export const POST = withApiHandler(
  async ({ request }) => authController.register(request),
  { auth: false },
);
