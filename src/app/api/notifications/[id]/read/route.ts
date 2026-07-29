import { withApiHandler } from "@/server/http/handler";
import { notificationController } from "@/server/controllers/notification.controller";

export const POST = withApiHandler<{ id: string }>(
  async ({ user, params }) =>
    notificationController.markAsRead(user, params.id),
);

export const PATCH = withApiHandler<{ id: string }>(
  async ({ user, params }) =>
    notificationController.markAsRead(user, params.id),
);
