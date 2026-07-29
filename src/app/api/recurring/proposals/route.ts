import { withApiHandler } from "@/server/http/handler";
import { recurringController } from "@/server/controllers/recurring.controller";

export const GET = withApiHandler(async ({ request, user }) =>
  recurringController.listProposals(user, request),
);
