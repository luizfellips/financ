"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { apiClient, downloadFile } from "@/lib/api-client";
import type { Settings, ThemePreference } from "@/types/models";

export const settingsKeys = {
  all: ["settings"] as const,
  detail: () => [...settingsKeys.all, "detail"] as const,
};

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.detail(),
    queryFn: async () => {
      const { data } = await apiClient<Settings>("/api/settings");
      return data;
    },
  });
}

type SettingsInput = {
  theme?: ThemePreference;
  currency?: string;
  locale?: string;
  monthStartDay?: number;
  notifyBudget?: boolean;
  notifyGoals?: boolean;
  notifyBills?: boolean;
};

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SettingsInput) => {
      const { data } = await apiClient<Settings>("/api/settings", {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsKeys.all });
      toast.success("Configurações salvas");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao salvar configurações");
    },
  });
}

export function useExportData() {
  return useMutation({
    mutationFn: async (format: "csv" | "json") => {
      await downloadFile(
        "/api/export",
        { format },
        `financ-export.${format}`,
      );
    },
    onSuccess: () => toast.success("Exportação iniciada"),
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao exportar dados");
    },
  });
}

export function useImportData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      format: "csv" | "json";
      entity: string;
      content: string;
    }) => {
      const { data } = await apiClient<{
        imported: number;
        skipped: number;
      }>("/api/import", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return data;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries();
      toast.success(
        `Importação concluída: ${data.imported ?? 0} registro(s)`,
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao importar dados");
    },
  });
}

export function useBackup() {
  return useMutation({
    mutationFn: async () => {
      await downloadFile("/api/backup", undefined, "financ-backup.json");
    },
    onSuccess: () => toast.success("Backup baixado"),
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao gerar backup");
    },
  });
}

export function useRestore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: unknown) => {
      const { data } = await apiClient<unknown>("/api/restore", {
        method: "POST",
        body: JSON.stringify({
          confirm: "RESTORE",
          backup: payload,
        }),
      });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries();
      toast.success("Backup restaurado com sucesso");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao restaurar backup");
    },
  });
}

export function usePurgeAllData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      confirmPhrase: string;
      confirmEmail: string;
      confirmFinal: string;
    }) => {
      const { data } = await apiClient<{ purged: boolean; message: string }>(
        "/api/account/purge",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );
      return data;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries();
      toast.success(data.message || "Dados apagados com sucesso");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao apagar dados");
    },
  });
}
