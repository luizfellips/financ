import { withApiHandler } from "@/server/http/handler";
import { transactionController } from "@/server/controllers/transaction.controller";

export const GET = withApiHandler(async ({ request, user }) =>
  transactionController.list(user, request),
);

export const POST = withApiHandler(async ({ request, user }) =>
  transactionController.create(user, request),
);
