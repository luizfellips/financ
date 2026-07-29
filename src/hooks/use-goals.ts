"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { apiClient } from "@/lib/api-client";
import type { Goal } from "@/types/models";

export const goalKeys = {
  all: ["goals"] as const,
  list: () => [...goalKeys.all, "list"] as const,
};

export function useGoals() {
  return useQuery({
    queryKey: goalKeys.list(),
    queryFn: async () => {
      const { data } = await apiClient<Goal[]>("/api/goals");
      return data;
    },
  });
}

type GoalInput = {
  name: string;
  targetAmount: number;
  savedAmount?: number;
  deadline?: string | null;
  color?: string;
  icon?: string;
};

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: GoalInput) => {
      const { data } = await apiClient<Goal>("/api/goals", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: goalKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Meta criada");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar meta");
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: Partial<GoalInput> & { id: string }) => {
      const { data } = await apiClient<Goal>(`/api/goals/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: goalKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Meta atualizada");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar meta");
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient<{ id: string }>(`/api/goals/${id}`, {
        method: "DELETE",
      });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: goalKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Meta excluída");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao excluir meta");
    },
  });
}

export function useContributeGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      amount,
      note,
      date,
    }: {
      id: string;
      amount: number;
      note?: string | null;
      date?: string;
    }) => {
      const { data } = await apiClient<Goal>(`/api/goals/${id}/contributions`, {
        method: "POST",
        body: JSON.stringify({ amount, note, date }),
      });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: goalKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Contribuição registrada");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao registrar contribuição");
    },
  });
}

type ContributionInput = {
  goalId: string;
  contributionId: string;
  amount?: number;
  note?: string | null;
  date?: string;
};

export function useUpdateContribution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      goalId,
      contributionId,
      amount,
      note,
      date,
    }: ContributionInput) => {
      const { data } = await apiClient<Goal>(
        `/api/goals/${goalId}/contributions/${contributionId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ amount, note, date }),
        },
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: goalKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Contribuição atualizada");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar contribuição");
    },
  });
}

export function useDeleteContribution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      goalId,
      contributionId,
    }: {
      goalId: string;
      contributionId: string;
    }) => {
      const { data } = await apiClient<{ id: string }>(
        `/api/goals/${goalId}/contributions/${contributionId}`,
        { method: "DELETE" },
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: goalKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Contribuição excluída");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao excluir contribuição");
    },
  });
}
