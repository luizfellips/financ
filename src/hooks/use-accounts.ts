"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { apiClient } from "@/lib/api-client";
import type { Account, AccountType } from "@/types/models";

export const accountKeys = {
  all: ["accounts"] as const,
  list: (month?: number, year?: number) =>
    [...accountKeys.all, "list", month ?? "current", year ?? "current"] as const,
};

export function useAccounts(month?: number, year?: number) {
  return useQuery({
    queryKey: accountKeys.list(month, year),
    queryFn: async () => {
      const { data } = await apiClient<Account[]>("/api/accounts", {
        params: { month, year },
      });
      return data;
    },
  });
}

type AccountInput = {
  name: string;
  type: AccountType;
  currency?: string;
  initialBalance: number;
  color?: string;
  icon?: string;
  isDefault?: boolean;
  archived?: boolean;
};

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AccountInput) => {
      const { data } = await apiClient<Account>("/api/accounts", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Conta criada");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar conta");
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: Partial<AccountInput> & { id: string }) => {
      const { data } = await apiClient<Account>(`/api/accounts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      return data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: accountKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(
        variables.archived ? "Conta arquivada" : "Conta atualizada",
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar conta");
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient<{ id: string }>(`/api/accounts/${id}`, {
        method: "DELETE",
      });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Conta arquivada");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao arquivar conta");
    },
  });
}
