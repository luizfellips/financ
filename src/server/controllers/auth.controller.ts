import { success } from "@/server/http/response";
import { RateLimitError } from "@/server/errors/app-error";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { authService } from "@/server/services/auth.service";
import { registerSchema } from "@/server/validation/schemas";
import type { NextRequest } from "next/server";

export const authController = {
  async register(request: NextRequest) {
    const limited = checkRateLimit(`register:${clientIp(request)}`, {
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (!limited.ok) {
      throw new RateLimitError(limited.retryAfterSec);
    }

    const body = registerSchema.parse(await request.json());
    const data = await authService.register(body);
    return success(data, { status: 201 });
  },
};
