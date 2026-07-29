import { NotFoundError } from "@/server/errors/app-error";
import { notificationRepository } from "@/server/repositories/notification.repository";

function mapNotification<
  T extends { createdAt: Date; metadata: unknown },
>(notification: T) {
  return {
    ...notification,
    createdAt: notification.createdAt.toISOString(),
  };
}

export const notificationService = {
  async list(userId: string, unreadOnly = false) {
    const [items, unreadCount] = await Promise.all([
      notificationRepository.findManyByUser(userId, { unreadOnly }),
      notificationRepository.countUnread(userId),
    ]);

    return {
      items: items.map(mapNotification),
      unreadCount,
    };
  },

  async markAsRead(userId: string, id: string) {
    const existing = await notificationRepository.findById(userId, id);
    if (!existing) {
      throw new NotFoundError("Notificação não encontrada");
    }

    const notification = await notificationRepository.markAsRead(userId, id);
    const unreadCount = await notificationRepository.countUnread(userId);

    return {
      notification: mapNotification(notification),
      unreadCount,
    };
  },

  async markAllAsRead(userId: string) {
    const result = await notificationRepository.markAllAsRead(userId);
    return {
      updated: result.count,
      unreadCount: 0,
    };
  },
};
