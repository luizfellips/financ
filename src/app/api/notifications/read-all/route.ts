import { withApiHandler } from "@/server/http/handler";
import { notificationController } from "@/server/controllers/notification.controller";

export const POST = withApiHandler(async ({ user }) =>
  notificationController.markAllAsRead(user),
);

export const PATCH = withApiHandler(async ({ user }) =>
  notificationController.markAllAsRead(user),
);
