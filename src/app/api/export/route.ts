import { withApiHandler } from "@/server/http/handler";
import { importExportController } from "@/server/controllers/import-export.controller";

export const GET = withApiHandler(async ({ request, user }) =>
  importExportController.exportData(user, request),
);
