import { withApiHandler } from "@/server/http/handler";
import { budgetController } from "@/server/controllers/budget.controller";

export const GET = withApiHandler<{ id: string }>(
  async ({ user, params }) => budgetController.getById(user, params.id),
);

export const PATCH = withApiHandler<{ id: string }>(
  async ({ request, user, params }) =>
    budgetController.update(user, params.id, request),
);

export const PUT = withApiHandler<{ id: string }>(
  async ({ request, user, params }) =>
    budgetController.update(user, params.id, request),
);

export const DELETE = withApiHandler<{ id: string }>(
  async ({ user, params }) => budgetController.delete(user, params.id),
);
