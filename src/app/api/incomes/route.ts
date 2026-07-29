import { withApiHandler } from "@/server/http/handler";
import { transactionController } from "@/server/controllers/transaction.controller";

export const GET = withApiHandler(async ({ request, user }) =>
  transactionController.listByType(user, request, "INCOME"),
);

export const POST = withApiHandler(async ({ request, user }) =>
  transactionController.createWithType(user, request, "INCOME"),
);
