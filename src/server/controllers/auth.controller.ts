import { success } from "@/server/http/response";
import { authService } from "@/server/services/auth.service";
import { registerSchema } from "@/server/validation/schemas";
import type { NextRequest } from "next/server";

export const authController = {
  async register(request: NextRequest) {
    const body = registerSchema.parse(await request.json());
    const data = await authService.register(body);
    return success(data, { status: 201 });
  },
};
