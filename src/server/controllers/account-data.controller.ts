import type { AuthenticatedUser } from "@/server/http/handler";
import { requireUser } from "@/server/http/handler";
import { success } from "@/server/http/response";
import { RateLimitError, ValidationError } from "@/server/errors/app-error";
import { accountDataService } from "@/server/services/account-data.service";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import type { NextRequest } from "next/server";
import { z } from "zod";

const purgeSchema = z.object({
  confirmPhrase: z.string().min(1),
  confirmEmail: z.string().email(),
  confirmFinal: z.string().min(1),
});

export const accountDataController = {
  async purge(user: AuthenticatedUser | null, request: NextRequest) {
    const authUser = requireUser(user);

    const limited = checkRateLimit(
      `purge:${authUser.id}:${clientIp(request)}`,
      { limit: 3, windowMs: 60 * 60 * 1000 },
    );
    if (!limited.ok) {
      throw new RateLimitError(limited.retryAfterSec);
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      throw new ValidationError("Corpo JSON inválido");
    }

    const parsed = purgeSchema.parse(body);
    const data = await accountDataService.purgeAll(authUser.id, parsed);
    return success(data);
  },
};
