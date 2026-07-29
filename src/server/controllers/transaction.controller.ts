import type { AuthenticatedUser } from "@/server/http/handler";
import { requireUser } from "@/server/http/handler";
import { success } from "@/server/http/response";
import { transactionService } from "@/server/services/transaction.service";
import {
  transactionFilterSchema,
  transactionSchema,
  transactionUpdateSchema,
} from "@/server/validation/schemas";
import type { NextRequest } from "next/server";
import type { TransactionType } from "@prisma/client";

function filtersFromRequest(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  return transactionFilterSchema.parse(params);
}

export const transactionController = {
  async list(user: AuthenticatedUser | null, request: NextRequest) {
    const authUser = requireUser(user);
    const filters = filtersFromRequest(request);
    const { items, meta } = await transactionService.list(authUser.id, filters);
    return success(items, { meta });
  },

  async listByType(
    user: AuthenticatedUser | null,
    request: NextRequest,
    type: TransactionType,
  ) {
    const authUser = requireUser(user);
    const filters = filtersFromRequest(request);
    const { items, meta } = await transactionService.listByType(
      authUser.id,
      type,
      filters,
    );
    return success(items, { meta });
  },

  async getById(user: AuthenticatedUser | null, id: string) {
    const authUser = requireUser(user);
    const data = await transactionService.getById(authUser.id, id);
    return success(data);
  },

  async create(user: AuthenticatedUser | null, request: NextRequest) {
    const authUser = requireUser(user);
    const body = transactionSchema.parse(await request.json());
    const data = await transactionService.create(authUser.id, body);
    return success(data, { status: 201 });
  },

  async createWithType(
    user: AuthenticatedUser | null,
    request: NextRequest,
    type: TransactionType,
  ) {
    const authUser = requireUser(user);
    const body = transactionSchema.parse({
      ...(await request.json()),
      type,
    });
    const data = await transactionService.create(authUser.id, body);
    return success(data, { status: 201 });
  },

  async update(
    user: AuthenticatedUser | null,
    id: string,
    request: NextRequest,
  ) {
    const authUser = requireUser(user);
    const body = transactionUpdateSchema.parse(await request.json());
    const data = await transactionService.update(authUser.id, id, body);
    return success(data);
  },

  async delete(
    user: AuthenticatedUser | null,
    id: string,
    request: NextRequest,
  ) {
    const authUser = requireUser(user);
    const deleteGroup =
      request.nextUrl.searchParams.get("deleteGroup") === "true";
    const data = await transactionService.delete(
      authUser.id,
      id,
      deleteGroup,
    );
    return success(data);
  },
};
