"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { apiClient } from "@/lib/api-client";
import type { Category, TransactionType } from "@/types/models";

export const categoryKeys = {
  all: ["categories"] as const,
  list: (type?: TransactionType) =>
    [...categoryKeys.all, "list", type ?? "all"] as const,
};

export function useCategories(type?: TransactionType) {
  return useQuery({
    queryKey: categoryKeys.list(type),
    queryFn: async () => {
      const { data } = await apiClient<Category[]>("/api/categories", {
        params: type ? { type } : undefined,
      });
      return data;
    },
  });
}

type CategoryInput = {
  name: string;
  type: TransactionType;
  color?: string;
  icon?: string;
};

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CategoryInput) => {
      const { data } = await apiClient<Category>("/api/categories", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success("Categoria criada");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar categoria");
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: Partial<CategoryInput> & { id: string }) => {
      const { data } = await apiClient<Category>(`/api/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success("Categoria atualizada");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar categoria");
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient<{ id: string }>(`/api/categories/${id}`, {
        method: "DELETE",
      });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success("Categoria excluída");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao excluir categoria");
    },
  });
}
