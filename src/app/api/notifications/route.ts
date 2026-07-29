import { withApiHandler } from "@/server/http/handler";
import { notificationController } from "@/server/controllers/notification.controller";

export const GET = withApiHandler(async ({ request, user }) =>
  notificationController.list(user, request),
);
