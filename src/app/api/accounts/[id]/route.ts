import { withApiHandler } from "@/server/http/handler";
import { accountController } from "@/server/controllers/account.controller";

export const GET = withApiHandler<{ id: string }>(
  async ({ user, params }) => accountController.getById(user, params.id),
);

export const PATCH = withApiHandler<{ id: string }>(
  async ({ request, user, params }) =>
    accountController.update(user, params.id, request),
);

export const PUT = withApiHandler<{ id: string }>(
  async ({ request, user, params }) =>
    accountController.update(user, params.id, request),
);

export const DELETE = withApiHandler<{ id: string }>(
  async ({ user, params }) => accountController.delete(user, params.id),
);
