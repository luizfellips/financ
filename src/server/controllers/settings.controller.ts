import type { AuthenticatedUser } from "@/server/http/handler";
import { requireUser } from "@/server/http/handler";
import { success } from "@/server/http/response";
import { settingsService } from "@/server/services/settings.service";
import { settingsSchema } from "@/server/validation/schemas";
import type { NextRequest } from "next/server";

export const settingsController = {
  async get(user: AuthenticatedUser | null) {
    const authUser = requireUser(user);
    const data = await settingsService.get(authUser.id);
    return success(data);
  },

  async update(user: AuthenticatedUser | null, request: NextRequest) {
    const authUser = requireUser(user);
    const body = settingsSchema.parse(await request.json());
    const data = await settingsService.update(authUser.id, body);
    return success(data);
  },
};
