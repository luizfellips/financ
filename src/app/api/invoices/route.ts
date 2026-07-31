import { withApiHandler } from "@/server/http/handler";
import { invoiceController } from "@/server/controllers/invoice.controller";

export const GET = withApiHandler(async ({ request, user }) =>
  invoiceController.list(user, request),
);
