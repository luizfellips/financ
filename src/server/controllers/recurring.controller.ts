import type { AuthenticatedUser } from "@/server/http/handler";
import { requireUser } from "@/server/http/handler";
import { success } from "@/server/http/response";
import { recurringService } from "@/server/services/recurring.service";
import {
  recurringPeriodSchema,
  recurringProposalActionSchema,
} from "@/server/validation/schemas";
import type { NextRequest } from "next/server";

export const recurringController = {
  async listProposals(user: AuthenticatedUser | null, request: NextRequest) {
    const authUser = requireUser(user);
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const period = recurringPeriodSchema.parse(params);
    const data = await recurringService.listProposals(authUser.id, period);
    return success(data);
  },

  async approve(user: AuthenticatedUser | null, request: NextRequest) {
    const authUser = requireUser(user);
    const body = recurringProposalActionSchema.parse(await request.json());
    const data = await recurringService.approve(
      authUser.id,
      body.proposalIds,
    );
    return success(data);
  },

  async reject(user: AuthenticatedUser | null, request: NextRequest) {
    const authUser = requireUser(user);
    const body = recurringProposalActionSchema.parse(await request.json());
    const data = await recurringService.reject(authUser.id, body.proposalIds);
    return success(data);
  },
};
