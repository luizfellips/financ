import { withApiHandler } from "@/server/http/handler";
import { categoryController } from "@/server/controllers/category.controller";

export const GET = withApiHandler(async ({ request, user }) =>
  categoryController.list(user, request),
);

export const POST = withApiHandler(async ({ request, user }) =>
  categoryController.create(user, request),
);
