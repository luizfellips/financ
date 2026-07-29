import { withApiHandler } from "@/server/http/handler";
import { dashboardController } from "@/server/controllers/dashboard.controller";

export const GET = withApiHandler(async ({ user }) =>
  dashboardController.get(user),
);
