import { withApiHandler } from "@/server/http/handler";
import { goalController } from "@/server/controllers/goal.controller";

export const GET = withApiHandler<{ id: string }>(
  async ({ user, params }) => goalController.getById(user, params.id),
);

export const PATCH = withApiHandler<{ id: string }>(
  async ({ request, user, params }) =>
    goalController.update(user, params.id, request),
);

export const PUT = withApiHandler<{ id: string }>(
  async ({ request, user, params }) =>
    goalController.update(user, params.id, request),
);

export const DELETE = withApiHandler<{ id: string }>(
  async ({ user, params }) => goalController.delete(user, params.id),
);
