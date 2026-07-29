import { withApiHandler } from "@/server/http/handler";
import { goalController } from "@/server/controllers/goal.controller";

export const POST = withApiHandler<{ id: string }>(
  async ({ request, user, params }) =>
    goalController.addContribution(user, params.id, request),
);
