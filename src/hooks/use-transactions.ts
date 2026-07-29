"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { apiClient } from "@/lib/api-client";
import type {
  Paginated,
  Transaction,
  TransactionFilters,
  TransactionType,
} from "@/types/models";
import type { PaginationMeta } from "@/types/api";

export const transactionKeys = {
  all: ["transactions"] as const,
  lists: () => [...transactionKeys.all, "list"] as const,
  list: (filters: TransactionFilters) =>
    [...transactionKeys.lists(), filters] as const,
  incomes: (filters: TransactionFilters) =>
    [...transactionKeys.all, "incomes", filters] as const,
  expenses: (filters: TransactionFilters) =>
    [...transactionKeys.all, "expenses", filters] as const,
};

type TransactionInput = {
  accountId: string;
  transferToAccountId?: string | null;
  categoryId?: string;
  type: TransactionType;
  title: string;
  amount: number;
  date: string;
  notes?: string | null;
  paymentMethod?: string;
  recurrence?: string;
  isRecurring?: boolean;
  installmentTotal?: number | null;
};

async function fetchTransactions(
  path: string,
  filters: TransactionFilters,
): Promise<Paginated<Transaction>> {
  const { data, meta } = await apiClient<Transaction[]>(path, {
    params: filters as Record<string, string | number | boolean | undefined>,
  });
  return {
    data,
    meta: meta ?? {
      page: 1,
      pageSize: 20,
      total: data.length,
      totalPages: 1,
    },
  };
}

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: () => fetchTransactions("/api/transactions", filters),
  });
}

export function useIncomes(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: transactionKeys.incomes(filters),
    queryFn: () => fetchTransactions("/api/incomes", filters),
  });
}

export function useExpenses(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: transactionKeys.expenses(filters),
    queryFn: () => fetchTransactions("/api/expenses", filters),
  });
}

function invalidateTransactionQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: transactionKeys.all });
  void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  void queryClient.invalidateQueries({ queryKey: ["budgets"] });
  void queryClient.invalidateQueries({ queryKey: ["reports"] });
  void queryClient.invalidateQueries({ queryKey: ["accounts"] });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TransactionInput) => {
      const { data } = await apiClient<Transaction>("/api/transactions", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return data;
    },
    onSuccess: () => {
      invalidateTransactionQueries(queryClient);
      toast.success("Transação criada com sucesso");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar transação");
    },
  });
}

export function useCreateIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<TransactionInput, "type">) => {
      const { data } = await apiClient<Transaction>("/api/incomes", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return data;
    },
    onSuccess: () => {
      invalidateTransactionQueries(queryClient);
      toast.success("Receita criada com sucesso");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar receita");
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<TransactionInput, "type">) => {
      const { data } = await apiClient<Transaction>("/api/expenses", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return data;
    },
    onSuccess: () => {
      invalidateTransactionQueries(queryClient);
      toast.success("Despesa criada com sucesso");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar despesa");
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: Partial<TransactionInput> & { id: string }) => {
      const { data } = await apiClient<Transaction>(`/api/transactions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      return data;
    },
    onSuccess: () => {
      invalidateTransactionQueries(queryClient);
      toast.success("Transação atualizada");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar transação");
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient<{ id: string }>(`/api/transactions/${id}`, {
        method: "DELETE",
      });
      return data;
    },
    onSuccess: () => {
      invalidateTransactionQueries(queryClient);
      toast.success("Transação excluída");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao excluir transação");
    },
  });
}

export type { PaginationMeta };
