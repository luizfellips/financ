"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { apiClient } from "@/lib/api-client";
import type { Notification } from "@/types/models";

type NotificationsPayload = {
  items: Notification[];
  unreadCount: number;
};

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (unreadOnly?: boolean) =>
    [...notificationKeys.all, "list", unreadOnly ?? false] as const,
};

export function useNotifications(unreadOnly = false) {
  return useQuery({
    queryKey: notificationKeys.list(unreadOnly),
    queryFn: async () => {
      const { data } = await apiClient<NotificationsPayload>(
        "/api/notifications",
        {
          params: unreadOnly ? { unreadOnly: true } : undefined,
        },
      );
      return data;
    },
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient<{
        notification: Notification;
        unreadCount: number;
      }>(`/api/notifications/${id}/read`, { method: "POST" });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao marcar notificação");
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient<{
        updated: number;
        unreadCount: number;
      }>("/api/notifications/read-all", { method: "POST" });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      toast.success("Todas as notificações foram marcadas como lidas");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao marcar notificações");
    },
  });
}
