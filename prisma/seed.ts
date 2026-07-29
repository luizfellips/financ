import { hash } from "bcryptjs";
import { PrismaClient, type PaymentMethod, type TransactionType } from "@prisma/client";
import { addMonths, subMonths, startOfMonth } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_USER_EMAIL ?? "demo@financ.app";
  const password = process.env.SEED_USER_PASSWORD ?? "Demo@123456";
  const name = process.env.SEED_USER_NAME ?? "Usuário Demo";

  console.log("Seeding database...");

  await prisma.notification.deleteMany();
  await prisma.goalContribution.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.category.deleteMany();
  await prisma.account.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.session.deleteMany();
  await prisma.authAccount.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      settings: {
        create: {
          theme: "SYSTEM",
          currency: "BRL",
          locale: "pt-BR",
        },
      },
    },
  });

  const account = await prisma.account.create({
    data: {
      userId: user.id,
      name: "Conta Principal",
      type: "CHECKING",
      initialBalance: 4500,
      isDefault: true,
      color: "#6366f1",
      icon: "Wallet",
    },
  });

  const incomeCategories = [
    { name: "Salário", color: "#22c55e", icon: "Briefcase" },
    { name: "Freelance", color: "#14b8a6", icon: "Laptop" },
    { name: "Investimentos", color: "#3b82f6", icon: "TrendingUp" },
    { name: "Outros", color: "#8b5cf6", icon: "PlusCircle" },
  ];

  const expenseCategories = [
    { name: "Moradia", color: "#ef4444", icon: "Home" },
    { name: "Alimentação", color: "#f97316", icon: "Utensils" },
    { name: "Transporte", color: "#eab308", icon: "Car" },
    { name: "Saúde", color: "#ec4899", icon: "HeartPulse" },
    { name: "Lazer", color: "#a855f7", icon: "Gamepad2" },
    { name: "Educação", color: "#06b6d4", icon: "GraduationCap" },
    { name: "Assinaturas", color: "#64748b", icon: "Repeat" },
    { name: "Outros", color: "#78716c", icon: "MoreHorizontal" },
  ];

  const createdIncomeCats = await Promise.all(
    incomeCategories.map((category) =>
      prisma.category.create({
        data: {
          userId: user.id,
          type: "INCOME",
          isSystem: true,
          ...category,
        },
      }),
    ),
  );

  const createdExpenseCats = await Promise.all(
    expenseCategories.map((category) =>
      prisma.category.create({
        data: {
          userId: user.id,
          type: "EXPENSE",
          isSystem: true,
          ...category,
        },
      }),
    ),
  );

  const now = new Date();
  const salaryCat = createdIncomeCats[0]!;
  const freelanceCat = createdIncomeCats[1]!;
  const housingCat = createdExpenseCats[0]!;
  const foodCat = createdExpenseCats[1]!;
  const transportCat = createdExpenseCats[2]!;
  const healthCat = createdExpenseCats[3]!;
  const leisureCat = createdExpenseCats[4]!;
  const educationCat = createdExpenseCats[5]!;
  const subscriptionsCat = createdExpenseCats[6]!;

  const txSeed: Array<{
    title: string;
    amount: number;
    type: TransactionType;
    categoryId: string;
    monthsAgo: number;
    day: number;
    paymentMethod?: PaymentMethod;
    isRecurring?: boolean;
    recurrence?: "NONE" | "MONTHLY";
    notes?: string;
  }> = [];

  for (let m = 0; m < 6; m++) {
    txSeed.push(
      {
        title: "Salário mensal",
        amount: 8500,
        type: "INCOME",
        categoryId: salaryCat.id,
        monthsAgo: m,
        day: 5,
        isRecurring: true,
        recurrence: "MONTHLY",
      },
      {
        title: "Aluguel",
        amount: 2200,
        type: "EXPENSE",
        categoryId: housingCat.id,
        monthsAgo: m,
        day: 10,
        paymentMethod: "PIX",
        isRecurring: true,
        recurrence: "MONTHLY",
      },
      {
        title: "Supermercado",
        amount: 650 + m * 20,
        type: "EXPENSE",
        categoryId: foodCat.id,
        monthsAgo: m,
        day: 12,
        paymentMethod: "DEBIT_CARD",
      },
      {
        title: "Combustível",
        amount: 320,
        type: "EXPENSE",
        categoryId: transportCat.id,
        monthsAgo: m,
        day: 15,
        paymentMethod: "CREDIT_CARD",
      },
      {
        title: "Netflix + Spotify",
        amount: 74.9,
        type: "EXPENSE",
        categoryId: subscriptionsCat.id,
        monthsAgo: m,
        day: 8,
        paymentMethod: "CREDIT_CARD",
        isRecurring: true,
        recurrence: "MONTHLY",
      },
    );
  }

  txSeed.push(
    {
      title: "Projeto freelance",
      amount: 2800,
      type: "INCOME",
      categoryId: freelanceCat.id,
      monthsAgo: 1,
      day: 20,
      paymentMethod: "PIX",
      notes: "Landing page para cliente",
    },
    {
      title: "Plano de saúde",
      amount: 480,
      type: "EXPENSE",
      categoryId: healthCat.id,
      monthsAgo: 0,
      day: 3,
      paymentMethod: "BOLETO",
      isRecurring: true,
      recurrence: "MONTHLY",
    },
    {
      title: "Cinema e jantar",
      amount: 210,
      type: "EXPENSE",
      categoryId: leisureCat.id,
      monthsAgo: 0,
      day: 18,
      paymentMethod: "CREDIT_CARD",
    },
    {
      title: "Curso online",
      amount: 197,
      type: "EXPENSE",
      categoryId: educationCat.id,
      monthsAgo: 2,
      day: 7,
      paymentMethod: "PIX",
    },
  );

  for (const item of txSeed) {
    const base = startOfMonth(subMonths(now, item.monthsAgo));
    const date = new Date(base.getFullYear(), base.getMonth(), item.day);
    await prisma.transaction.create({
      data: {
        userId: user.id,
        accountId: account.id,
        categoryId: item.categoryId,
        type: item.type,
        title: item.title,
        amount: item.amount,
        date,
        paymentMethod: item.paymentMethod ?? "PIX",
        isRecurring: item.isRecurring ?? false,
        recurrence: item.recurrence ?? "NONE",
        notes: item.notes,
      },
    });
  }

  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  await prisma.budget.createMany({
    data: [
      {
        userId: user.id,
        categoryId: foodCat.id,
        month: currentMonth,
        year: currentYear,
        limitAmount: 800,
        alertAt: 80,
      },
      {
        userId: user.id,
        categoryId: leisureCat.id,
        month: currentMonth,
        year: currentYear,
        limitAmount: 400,
        alertAt: 75,
      },
      {
        userId: user.id,
        categoryId: transportCat.id,
        month: currentMonth,
        year: currentYear,
        limitAmount: 500,
        alertAt: 80,
      },
      {
        userId: user.id,
        categoryId: subscriptionsCat.id,
        month: currentMonth,
        year: currentYear,
        limitAmount: 150,
        alertAt: 90,
      },
    ],
  });

  const emergencyGoal = await prisma.goal.create({
    data: {
      userId: user.id,
      name: "Reserva de emergência",
      targetAmount: 25000,
      savedAmount: 8500,
      deadline: addMonths(now, 10),
      color: "#22c55e",
      icon: "Shield",
    },
  });

  const tripGoal = await prisma.goal.create({
    data: {
      userId: user.id,
      name: "Viagem Europa",
      targetAmount: 15000,
      savedAmount: 4200,
      deadline: addMonths(now, 14),
      color: "#3b82f6",
      icon: "Plane",
    },
  });

  await prisma.goalContribution.createMany({
    data: [
      {
        goalId: emergencyGoal.id,
        amount: 1500,
        note: "Aporte mensal",
        date: subMonths(now, 2),
      },
      {
        goalId: emergencyGoal.id,
        amount: 2000,
        note: "Bônus",
        date: subMonths(now, 1),
      },
      {
        goalId: tripGoal.id,
        amount: 800,
        note: "Economia do mês",
        date: subMonths(now, 1),
      },
      {
        goalId: tripGoal.id,
        amount: 1000,
        note: "Freelance extra",
        date: now,
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: user.id,
        type: "SYSTEM",
        title: "Bem-vindo ao Financ",
        message: "Sua conta demo está pronta. Explore o dashboard e os relatórios.",
      },
      {
        userId: user.id,
        type: "BUDGET_WARNING",
        title: "Orçamento de Alimentação",
        message: "Você já utilizou mais de 80% do orçamento de Alimentação este mês.",
      },
      {
        userId: user.id,
        type: "GOAL_REACHED",
        title: "Progresso na meta",
        message: "Sua reserva de emergência já passou de 30% do objetivo.",
      },
    ],
  });

  console.log("Seed completed successfully.");
  console.log(`Login: ${email}`);
  console.log(`Password: ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
