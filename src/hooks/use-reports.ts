"use client";

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import type { ReportsData } from "@/types/models";

export const reportKeys = {
  all: ["reports"] as const,
  overview: () => [...reportKeys.all, "overview"] as const,
};

export function useReports() {
  return useQuery({
    queryKey: reportKeys.overview(),
    queryFn: async () => {
      const { data } = await apiClient<ReportsData>("/api/reports");
      return data;
    },
  });
}
