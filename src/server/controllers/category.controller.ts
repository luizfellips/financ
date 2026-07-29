import type { AuthenticatedUser } from "@/server/http/handler";
import { requireUser } from "@/server/http/handler";
import { success } from "@/server/http/response";
import { categoryService } from "@/server/services/category.service";
import { categorySchema } from "@/server/validation/schemas";
import type { NextRequest } from "next/server";
import type { TransactionType } from "@prisma/client";

export const categoryController = {
  async list(user: AuthenticatedUser | null, request: NextRequest) {
    const authUser = requireUser(user);
    const typeParam = request.nextUrl.searchParams.get("type");
    const type =
      typeParam === "INCOME" || typeParam === "EXPENSE"
        ? (typeParam as TransactionType)
        : undefined;
    const data = await categoryService.list(authUser.id, type);
    return success(data);
  },

  async getById(user: AuthenticatedUser | null, id: string) {
    const authUser = requireUser(user);
    const data = await categoryService.getById(authUser.id, id);
    return success(data);
  },

  async create(user: AuthenticatedUser | null, request: NextRequest) {
    const authUser = requireUser(user);
    const body = categorySchema.parse(await request.json());
    const data = await categoryService.create(authUser.id, body);
    return success(data, { status: 201 });
  },

  async update(
    user: AuthenticatedUser | null,
    id: string,
    request: NextRequest,
  ) {
    const authUser = requireUser(user);
    const body = categorySchema.partial().parse(await request.json());
    const data = await categoryService.update(authUser.id, id, body);
    return success(data);
  },

  async delete(user: AuthenticatedUser | null, id: string) {
    const authUser = requireUser(user);
    const data = await categoryService.delete(authUser.id, id);
    return success(data);
  },
};
