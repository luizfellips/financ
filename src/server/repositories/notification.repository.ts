import type { Notification, NotificationType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CreateNotificationData = {
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Prisma.InputJsonValue;
};

export const notificationRepository = {
  async findManyByUser(
    userId: string,
    options: { unreadOnly?: boolean; take?: number } = {},
  ): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: {
        userId,
        ...(options.unreadOnly ? { read: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      ...(options.take ? { take: options.take } : {}),
    });
  },

  async findById(userId: string, id: string): Promise<Notification | null> {
    return prisma.notification.findFirst({
      where: { id, userId },
    });
  },

  async create(
    userId: string,
    data: CreateNotificationData,
  ): Promise<Notification> {
    return prisma.notification.create({
      data: {
        userId,
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata ?? undefined,
      },
    });
  },

  async markAsRead(userId: string, id: string): Promise<Notification> {
    const existing = await prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new Error("NOT_FOUND");
    }
    return prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  },

  async markAllAsRead(userId: string): Promise<Prisma.BatchPayload> {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  },

  async countUnread(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, read: false },
    });
  },

  async findRecentByTypeAndMeta(
    userId: string,
    type: NotificationType,
    budgetId: string,
    since: Date,
  ): Promise<Notification | null> {
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        type,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return (
      notifications.find((n) => {
        const meta = n.metadata as { budgetId?: string } | null;
        return meta?.budgetId === budgetId;
      }) ?? null
    );
  },
};
