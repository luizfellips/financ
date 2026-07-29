import { withApiHandler } from "@/server/http/handler";
import { budgetController } from "@/server/controllers/budget.controller";

export const GET = withApiHandler(async ({ request, user }) =>
  budgetController.list(user, request),
);

export const POST = withApiHandler(async ({ request, user }) =>
  budgetController.create(user, request),
);
