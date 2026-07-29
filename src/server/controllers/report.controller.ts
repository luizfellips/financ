import type { AuthenticatedUser } from "@/server/http/handler";
import { requireUser } from "@/server/http/handler";
import { success } from "@/server/http/response";
import { reportService } from "@/server/services/report.service";

export const reportController = {
  async get(user: AuthenticatedUser | null) {
    const authUser = requireUser(user);
    const data = await reportService.getReports(authUser.id);
    return success(data);
  },
};
