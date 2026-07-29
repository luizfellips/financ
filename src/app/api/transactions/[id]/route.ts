import { withApiHandler } from "@/server/http/handler";
import { transactionController } from "@/server/controllers/transaction.controller";

export const GET = withApiHandler<{ id: string }>(
  async ({ user, params }) => transactionController.getById(user, params.id),
);

export const PATCH = withApiHandler<{ id: string }>(
  async ({ request, user, params }) =>
    transactionController.update(user, params.id, request),
);

export const PUT = withApiHandler<{ id: string }>(
  async ({ request, user, params }) =>
    transactionController.update(user, params.id, request),
);

export const DELETE = withApiHandler<{ id: string }>(
  async ({ request, user, params }) =>
    transactionController.delete(user, params.id, request),
);
