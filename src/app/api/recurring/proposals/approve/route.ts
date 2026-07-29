import { withApiHandler } from "@/server/http/handler";
import { recurringController } from "@/server/controllers/recurring.controller";

export const POST = withApiHandler(async ({ request, user }) =>
  recurringController.approve(user, request),
);
