import { withApiHandler } from "@/server/http/handler";
import { invoiceController } from "@/server/controllers/invoice.controller";

export const GET = withApiHandler<{ accountId: string }>(
  async ({ request, user, params }) =>
    invoiceController.getByAccount(user, params.accountId, request),
);

export const PATCH = withApiHandler<{ accountId: string }>(
  async ({ request, user, params }) =>
    invoiceController.update(user, params.accountId, request),
);
