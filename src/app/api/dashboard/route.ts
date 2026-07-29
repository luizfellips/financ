import { withApiHandler } from "@/server/http/handler";
import { dashboardController } from "@/server/controllers/dashboard.controller";

export const GET = withApiHandler(async ({ request, user }) =>
  dashboardController.get(user, request),
);
