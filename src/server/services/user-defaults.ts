export const DEFAULT_INCOME_CATEGORIES = [
  { name: "Salário", color: "#22c55e", icon: "Wallet" },
  { name: "Freelance", color: "#10b981", icon: "Briefcase" },
  { name: "Investimentos", color: "#14b8a6", icon: "TrendingUp" },
  { name: "Outros", color: "#84cc16", icon: "PlusCircle" },
] as const;

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Moradia", color: "#ef4444", icon: "Home" },
  { name: "Alimentação", color: "#f97316", icon: "Utensils" },
  { name: "Transporte", color: "#eab308", icon: "Car" },
  { name: "Saúde", color: "#ec4899", icon: "HeartPulse" },
  { name: "Lazer", color: "#8b5cf6", icon: "Gamepad2" },
  { name: "Educação", color: "#3b82f6", icon: "GraduationCap" },
  { name: "Assinaturas", color: "#6366f1", icon: "Repeat" },
  { name: "Outros", color: "#64748b", icon: "MoreHorizontal" },
] as const;

export function buildDefaultCategories() {
  return [
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
}

export const DEFAULT_ACCOUNT = {
  name: "Conta Principal",
  type: "CHECKING" as const,
  currency: "BRL",
  initialBalance: 0,
  color: "#6366f1",
  icon: "Wallet",
  isDefault: true,
};
