import type { AuthenticatedUser } from "@/server/http/handler";
import { requireUser } from "@/server/http/handler";
import { success } from "@/server/http/response";
import { notificationService } from "@/server/services/notification.service";
import type { NextRequest } from "next/server";

export const notificationController = {
  async list(user: AuthenticatedUser | null, request: NextRequest) {
    const authUser = requireUser(user);
    const unreadOnly =
      request.nextUrl.searchParams.get("unreadOnly") === "true";
    const data = await notificationService.list(authUser.id, unreadOnly);
    return success(data);
  },

  async markAsRead(user: AuthenticatedUser | null, id: string) {
    const authUser = requireUser(user);
    const data = await notificationService.markAsRead(authUser.id, id);
    return success(data);
  },

  async markAllAsRead(user: AuthenticatedUser | null) {
    const authUser = requireUser(user);
    const data = await notificationService.markAllAsRead(authUser.id);
    return success(data);
  },
};
