import { withApiHandler } from "@/server/http/handler";
import { reportController } from "@/server/controllers/report.controller";

export const GET = withApiHandler(async ({ user }) =>
  reportController.get(user),
);
