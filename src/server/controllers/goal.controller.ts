import type { AuthenticatedUser } from "@/server/http/handler";
import { requireUser } from "@/server/http/handler";
import { success } from "@/server/http/response";
import { goalService } from "@/server/services/goal.service";
import {
  goalContributionSchema,
  goalSchema,
} from "@/server/validation/schemas";
import type { NextRequest } from "next/server";

export const goalController = {
  async list(user: AuthenticatedUser | null) {
    const authUser = requireUser(user);
    const data = await goalService.list(authUser.id);
    return success(data);
  },

  async getById(user: AuthenticatedUser | null, id: string) {
    const authUser = requireUser(user);
    const data = await goalService.getById(authUser.id, id);
    return success(data);
  },

  async create(user: AuthenticatedUser | null, request: NextRequest) {
    const authUser = requireUser(user);
    const body = goalSchema.parse(await request.json());
    const data = await goalService.create(authUser.id, body);
    return success(data, { status: 201 });
  },

  async update(
    user: AuthenticatedUser | null,
    id: string,
    request: NextRequest,
  ) {
    const authUser = requireUser(user);
    const body = goalSchema.partial().parse(await request.json());
    const data = await goalService.update(authUser.id, id, body);
    return success(data);
  },

  async delete(user: AuthenticatedUser | null, id: string) {
    const authUser = requireUser(user);
    const data = await goalService.delete(authUser.id, id);
    return success(data);
  },

  async addContribution(
    user: AuthenticatedUser | null,
    id: string,
    request: NextRequest,
  ) {
    const authUser = requireUser(user);
    const body = goalContributionSchema.parse(await request.json());
    const data = await goalService.addContribution(authUser.id, id, body);
    return success(data, { status: 201 });
  },
};
