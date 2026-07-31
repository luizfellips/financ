"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { apiClient } from "@/lib/api-client";
import type { CreditInvoiceDetail, CreditInvoiceSummary } from "@/types/models";

export const invoiceKeys = {
  all: ["invoices"] as const,
  list: (month?: number, year?: number) =>
    [...invoiceKeys.all, "list", month ?? "current", year ?? "current"] as const,
  detail: (accountId: string, month?: number, year?: number) =>
    [
      ...invoiceKeys.all,
      "detail",
      accountId,
      month ?? "current",
      year ?? "current",
    ] as const,
};

export function useInvoices(month?: number, year?: number) {
  return useQuery({
    queryKey: invoiceKeys.list(month, year),
    queryFn: async () => {
      const { data } = await apiClient<CreditInvoiceSummary[]>("/api/invoices", {
        params: { month, year },
      });
      return data;
    },
  });
}

export function useInvoiceDetail(
  accountId: string | null | undefined,
  month?: number,
  year?: number,
) {
  return useQuery({
    queryKey: invoiceKeys.detail(accountId ?? "", month, year),
    enabled: Boolean(accountId),
    queryFn: async () => {
      const { data } = await apiClient<CreditInvoiceDetail>(
        `/api/invoices/${accountId}`,
        { params: { month, year } },
      );
      return data;
    },
  });
}

export function useUpdateInvoiceOpening() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      accountId: string;
      openingAmount: number;
      month?: number;
      year?: number;
      notes?: string | null;
    }) => {
      const { accountId, ...body } = input;
      const { data } = await apiClient<CreditInvoiceDetail>(
        `/api/invoices/${accountId}`,
        {
          method: "PATCH",
          body: JSON.stringify(body),
        },
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["accounts"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Valor inicial atualizado");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar fatura");
    },
  });
}

export function usePayInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      accountId: string;
      fromAccountId: string;
      amount: number;
      date?: string;
      title?: string;
      notes?: string | null;
      month?: number;
      year?: number;
    }) => {
      const { accountId, ...body } = input;
      const { data } = await apiClient<{
        transfer: unknown;
        invoice: CreditInvoiceDetail;
      }>(`/api/invoices/${accountId}/pay`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["accounts"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Pagamento registrado");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao pagar fatura");
    },
  });
}
