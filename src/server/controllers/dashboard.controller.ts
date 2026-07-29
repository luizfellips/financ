import type { AuthenticatedUser } from "@/server/http/handler";
import { requireUser } from "@/server/http/handler";
import { success } from "@/server/http/response";
import { dashboardService } from "@/server/services/dashboard.service";
import { periodQuerySchema } from "@/server/validation/schemas";
import type { NextRequest } from "next/server";

export const dashboardController = {
  async get(user: AuthenticatedUser | null, request: NextRequest) {
    const authUser = requireUser(user);
    const query = periodQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries()),
    );
    const data = await dashboardService.getOverview(authUser.id, query);
    return success(data);
  },
};
