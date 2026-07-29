import { withApiHandler } from "@/server/http/handler";
import { categoryController } from "@/server/controllers/category.controller";

export const GET = withApiHandler<{ id: string }>(
  async ({ user, params }) => categoryController.getById(user, params.id),
);

export const PATCH = withApiHandler<{ id: string }>(
  async ({ request, user, params }) =>
    categoryController.update(user, params.id, request),
);

export const PUT = withApiHandler<{ id: string }>(
  async ({ request, user, params }) =>
    categoryController.update(user, params.id, request),
);

export const DELETE = withApiHandler<{ id: string }>(
  async ({ user, params }) => categoryController.delete(user, params.id),
);
