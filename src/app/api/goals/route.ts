import { withApiHandler } from "@/server/http/handler";
import { goalController } from "@/server/controllers/goal.controller";

export const GET = withApiHandler(async ({ user }) =>
  goalController.list(user),
);

export const POST = withApiHandler(async ({ request, user }) =>
  goalController.create(user, request),
);
