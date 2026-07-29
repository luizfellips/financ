"use client";

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import type { DashboardOverview } from "@/types/models";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  overview: (month: number, year: number) =>
    [...dashboardKeys.all, "overview", month, year] as const,
};

export function useDashboard(month: number, year: number) {
  return useQuery({
    queryKey: dashboardKeys.overview(month, year),
    queryFn: async () => {
      const { data } = await apiClient<DashboardOverview>("/api/dashboard", {
        params: { month, year },
      });
      return data;
    },
  });
}
