"use client";

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import type { DashboardOverview } from "@/types/models";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  overview: () => [...dashboardKeys.all, "overview"] as const,
};

export function useDashboard() {
  return useQuery({
    queryKey: dashboardKeys.overview(),
    queryFn: async () => {
      const { data } = await apiClient<DashboardOverview>("/api/dashboard");
      return data;
    },
  });
}
