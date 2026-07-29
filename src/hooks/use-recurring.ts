"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { apiClient } from "@/lib/api-client";
import type { RecurringProposalsResponse } from "@/types/models";
import { transactionKeys } from "@/hooks/use-transactions";

export const recurringKeys = {
  all: ["recurring"] as const,
  proposals: (month: number, year: number) =>
    [...recurringKeys.all, "proposals", month, year] as const,
};

function invalidateAfterDecision(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({ queryKey: recurringKeys.all });
  void queryClient.invalidateQueries({ queryKey: transactionKeys.all });
  void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  void queryClient.invalidateQueries({ queryKey: ["budgets"] });
  void queryClient.invalidateQueries({ queryKey: ["reports"] });
  void queryClient.invalidateQueries({ queryKey: ["accounts"] });
}

export function useRecurringProposals(month: number, year: number) {
  return useQuery({
    queryKey: recurringKeys.proposals(month, year),
    queryFn: async () => {
      const { data } = await apiClient<RecurringProposalsResponse>(
        "/api/recurring/proposals",
        { params: { month, year } },
      );
      return data;
    },
  });
}

export function useApproveRecurringProposals() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (proposalIds: string[]) => {
      const { data } = await apiClient<{ count: number }>(
        "/api/recurring/proposals/approve",
        {
          method: "POST",
          body: JSON.stringify({ proposalIds }),
        },
      );
      return data;
    },
    onSuccess: (data) => {
      invalidateAfterDecision(queryClient);
      toast.success(
        data.count === 1
          ? "1 lançamento criado"
          : `${data.count} lançamentos criados`,
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || "Falha ao aprovar propostas");
    },
  });
}

export function useRejectRecurringProposals() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (proposalIds: string[]) => {
      const { data } = await apiClient<{ count: number }>(
        "/api/recurring/proposals/reject",
        {
          method: "POST",
          body: JSON.stringify({ proposalIds }),
        },
      );
      return data;
    },
    onSuccess: (data) => {
      invalidateAfterDecision(queryClient);
      toast.success(
        data.count === 1
          ? "1 proposta rejeitada"
          : `${data.count} propostas rejeitadas`,
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || "Falha ao rejeitar propostas");
    },
  });
}
