import bcrypt from "bcryptjs";
import { ConflictError } from "@/server/errors/app-error";
import { userRepository } from "@/server/repositories/user.repository";
import {
  buildDefaultCategories,
  DEFAULT_ACCOUNT,
} from "@/server/services/user-defaults";
import type { z } from "zod";
import type { registerSchema } from "@/server/validation/schemas";

type RegisterInput = z.infer<typeof registerSchema>;

export const authService = {
  async register(input: RegisterInput) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError("Já existe uma conta com este e-mail");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await userRepository.createWithDefaults(
      {
        name: input.name,
        email: input.email,
        passwordHash,
      },
      {
        account: DEFAULT_ACCOUNT,
        categories: buildDefaultCategories(),
      },
    );

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
    };
  },

  async verifyCredentials(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) return null;

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  },
};
