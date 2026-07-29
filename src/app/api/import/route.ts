import { withApiHandler } from "@/server/http/handler";
import { importExportController } from "@/server/controllers/import-export.controller";

export const POST = withApiHandler(async ({ request, user }) =>
  importExportController.importData(user, request),
);
