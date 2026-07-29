import { requireUser } from "@/server/http/handler";
import { success } from "@/server/http/response";
import { accountService } from "@/server/services/account.service";
import {
  accountSchema,
} from "@/server/validation/schemas";
import type { AuthenticatedUser } from "@/server/http/handler";
import type { NextRequest } from "next/server";
import { z } from "zod";

const accountUpdateSchema = accountSchema.partial().extend({
  archived: z.boolean().optional(),
});

export const accountController = {
  async list(user: AuthenticatedUser | null, request: NextRequest) {
    const authUser = requireUser(user);
    const includeArchived =
      request.nextUrl.searchParams.get("includeArchived") === "true";
    const data = await accountService.list(authUser.id, includeArchived);
    return success(data);
  },

  async getById(user: AuthenticatedUser | null, id: string) {
    const authUser = requireUser(user);
    const data = await accountService.getById(authUser.id, id);
    return success(data);
  },

  async create(user: AuthenticatedUser | null, request: NextRequest) {
    const authUser = requireUser(user);
    const body = accountSchema.parse(await request.json());
    const data = await accountService.create(authUser.id, body);
    return success(data, { status: 201 });
  },

  async update(
    user: AuthenticatedUser | null,
    id: string,
    request: NextRequest,
  ) {
    const authUser = requireUser(user);
    const body = accountUpdateSchema.parse(await request.json());
    const data = await accountService.update(authUser.id, id, body);
    return success(data);
  },

  async delete(user: AuthenticatedUser | null, id: string) {
    const authUser = requireUser(user);
    const data = await accountService.delete(authUser.id, id);
    return success(data);
  },
};
