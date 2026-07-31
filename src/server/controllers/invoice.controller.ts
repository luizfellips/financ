import { requireUser } from "@/server/http/handler";
import { success } from "@/server/http/response";
import { invoiceService } from "@/server/services/invoice.service";
import {
  invoicePaySchema,
  invoiceUpdateSchema,
  periodQuerySchema,
} from "@/server/validation/schemas";
import type { AuthenticatedUser } from "@/server/http/handler";
import type { NextRequest } from "next/server";

export const invoiceController = {
  async list(user: AuthenticatedUser | null, request: NextRequest) {
    const authUser = requireUser(user);
    const query = periodQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries()),
    );
    const data = await invoiceService.list(
      authUser.id,
      query.month,
      query.year,
    );
    return success(data);
  },

  async getByAccount(
    user: AuthenticatedUser | null,
    accountId: string,
    request: NextRequest,
  ) {
    const authUser = requireUser(user);
    const query = periodQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries()),
    );
    const data = await invoiceService.getDetail(
      authUser.id,
      accountId,
      query.month,
      query.year,
    );
    return success(data);
  },

  async update(
    user: AuthenticatedUser | null,
    accountId: string,
    request: NextRequest,
  ) {
    const authUser = requireUser(user);
    const body = invoiceUpdateSchema.parse(await request.json());
    const data = await invoiceService.updateOpening(authUser.id, accountId, body);
    return success(data);
  },

  async pay(
    user: AuthenticatedUser | null,
    accountId: string,
    request: NextRequest,
  ) {
    const authUser = requireUser(user);
    const body = invoicePaySchema.parse(await request.json());
    const data = await invoiceService.pay(authUser.id, accountId, body);
    return success(data, { status: 201 });
  },
};
