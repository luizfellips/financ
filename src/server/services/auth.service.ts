import bcrypt from "bcryptjs";
import { ConflictError } from "@/server/errors/app-error";
import { userRepository } from "@/server/repositories/user.repository";
import type { z } from "zod";
import type { registerSchema } from "@/server/validation/schemas";

type RegisterInput = z.infer<typeof registerSchema>;

const DEFAULT_INCOME_CATEGORIES = [
  { name: "Salário", color: "#22c55e", icon: "Wallet" },
  { name: "Freelance", color: "#10b981", icon: "Briefcase" },
  { name: "Investimentos", color: "#14b8a6", icon: "TrendingUp" },
  { name: "Outros", color: "#84cc16", icon: "PlusCircle" },
] as const;

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Moradia", color: "#ef4444", icon: "Home" },
  { name: "Alimentação", color: "#f97316", icon: "Utensils" },
  { name: "Transporte", color: "#eab308", icon: "Car" },
  { name: "Saúde", color: "#ec4899", icon: "HeartPulse" },
  { name: "Lazer", color: "#8b5cf6", icon: "Gamepad2" },
  { name: "Educação", color: "#3b82f6", icon: "GraduationCap" },
  { name: "Assinaturas", color: "#6366f1", icon: "Repeat" },
  { name: "Outros", color: "#64748b", icon: "MoreHorizontal" },
] as const;

export const authService = {
  async register(input: RegisterInput) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError("Já existe uma conta com este e-mail");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const categories = [
      ...DEFAULT_INCOME_CATEGORIES.map((c) => ({
        name: c.name,
        type: "INCOME" as const,
        color: c.color,
        icon: c.icon,
        isSystem: true,
      })),
      ...DEFAULT_EXPENSE_CATEGORIES.map((c) => ({
        name: c.name,
        type: "EXPENSE" as const,
        color: c.color,
        icon: c.icon,
        isSystem: true,
      })),
    ];

    const user = await userRepository.createWithDefaults(
      {
        name: input.name,
        email: input.email,
        passwordHash,
      },
      {
        account: {
          name: "Conta Principal",
          type: "CHECKING",
          currency: "BRL",
          initialBalance: 0,
          color: "#6366f1",
          icon: "Wallet",
          isDefault: true,
        },
        categories,
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
