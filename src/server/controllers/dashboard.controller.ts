import type { AuthenticatedUser } from "@/server/http/handler";
import { requireUser } from "@/server/http/handler";
import { success } from "@/server/http/response";
import { dashboardService } from "@/server/services/dashboard.service";

export const dashboardController = {
  async get(user: AuthenticatedUser | null) {
    const authUser = requireUser(user);
    const data = await dashboardService.getOverview(authUser.id);
    return success(data);
  },
};
