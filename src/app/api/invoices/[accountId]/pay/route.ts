import { withApiHandler } from "@/server/http/handler";
import { invoiceController } from "@/server/controllers/invoice.controller";

export const POST = withApiHandler<{ accountId: string }>(
  async ({ request, user, params }) =>
    invoiceController.pay(user, params.accountId, request),
);
