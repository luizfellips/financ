import type { AuthenticatedUser } from "@/server/http/handler";
import { requireUser } from "@/server/http/handler";
import { success } from "@/server/http/response";
import { budgetService } from "@/server/services/budget.service";
import { budgetSchema } from "@/server/validation/schemas";
import type { NextRequest } from "next/server";
import { z } from "zod";

const listQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export const budgetController = {
  async list(user: AuthenticatedUser | null, request: NextRequest) {
    const authUser = requireUser(user);
    const query = listQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries()),
    );
    const data = await budgetService.list(authUser.id, query);
    return success(data);
  },

  async getById(user: AuthenticatedUser | null, id: string) {
    const authUser = requireUser(user);
    const data = await budgetService.getById(authUser.id, id);
    return success(data);
  },

  async create(user: AuthenticatedUser | null, request: NextRequest) {
    const authUser = requireUser(user);
    const body = budgetSchema.parse(await request.json());
    const data = await budgetService.create(authUser.id, body);
    return success(data, { status: 201 });
  },

  async update(
    user: AuthenticatedUser | null,
    id: string,
    request: NextRequest,
  ) {
    const authUser = requireUser(user);
    const body = budgetSchema.partial().parse(await request.json());
    const data = await budgetService.update(authUser.id, id, body);
    return success(data);
  },

  async delete(user: AuthenticatedUser | null, id: string) {
    const authUser = requireUser(user);
    const data = await budgetService.delete(authUser.id, id);
    return success(data);
  },
};
