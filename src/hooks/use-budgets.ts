"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { apiClient } from "@/lib/api-client";
import type { Budget } from "@/types/models";

export const budgetKeys = {
  all: ["budgets"] as const,
  list: (month?: number, year?: number) =>
    [...budgetKeys.all, "list", month, year] as const,
};

export function useBudgets(month?: number, year?: number) {
  return useQuery({
    queryKey: budgetKeys.list(month, year),
    queryFn: async () => {
      const { data } = await apiClient<Budget[]>("/api/budgets", {
        params: { month, year },
      });
      return data;
    },
  });
}

type BudgetInput = {
  categoryId: string;
  month: number;
  year: number;
  limitAmount: number;
  alertAt?: number;
};

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: BudgetInput) => {
      const { data } = await apiClient<Budget>("/api/budgets", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: budgetKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Orçamento criado");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar orçamento");
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: Partial<BudgetInput> & { id: string }) => {
      const { data } = await apiClient<Budget>(`/api/budgets/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: budgetKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Orçamento atualizado");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar orçamento");
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient<{ id: string }>(`/api/budgets/${id}`, {
        method: "DELETE",
      });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: budgetKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Orçamento excluído");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao excluir orçamento");
    },
  });
}
