import { prisma } from "@/lib/prisma";
import {
  PURGE_CONFIRM_FINAL,
  PURGE_CONFIRM_PHRASE,
} from "@/lib/purge-confirm";
import { ValidationError } from "@/server/errors/app-error";
import { userRepository } from "@/server/repositories/user.repository";
import {
  buildDefaultCategories,
  DEFAULT_ACCOUNT,
} from "@/server/services/user-defaults";

export type PurgeInput = {
  confirmPhrase: string;
  confirmEmail: string;
  confirmFinal: string;
};

export const accountDataService = {
  /**
   * Wipes all financial data for the user and reseeds defaults
   * (primary account + system categories + reset settings).
   * Does not delete the User / auth credentials.
   */
  async purgeAll(userId: string, input: PurgeInput) {
    if (input.confirmPhrase.trim() !== PURGE_CONFIRM_PHRASE) {
      throw new ValidationError(
        `Confirme digitando exatamente: ${PURGE_CONFIRM_PHRASE}`,
        [{ path: "confirmPhrase", message: "Frase de confirmação inválida" }],
      );
    }

    if (input.confirmFinal.trim() !== PURGE_CONFIRM_FINAL) {
      throw new ValidationError("Confirmação final inválida", [
        { path: "confirmFinal", message: "Token de confirmação inválido" },
      ]);
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ValidationError("Usuário não encontrado");
    }

    if (input.confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
      throw new ValidationError(
        "O e-mail digitado não corresponde à conta",
        [{ path: "confirmEmail", message: "E-mail de confirmação inválido" }],
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.goalContribution.deleteMany({
        where: { goal: { userId } },
      });
      await tx.goal.deleteMany({ where: { userId } });
      await tx.budget.deleteMany({ where: { userId } });
      await tx.transaction.deleteMany({ where: { userId } });
      await tx.notification.deleteMany({ where: { userId } });
      await tx.category.deleteMany({ where: { userId } });
      await tx.account.deleteMany({ where: { userId } });

      await tx.settings.upsert({
        where: { userId },
        create: { userId },
        update: {
          theme: "SYSTEM",
          currency: "BRL",
          locale: "pt-BR",
          monthStartDay: 1,
          notifyBudget: true,
          notifyGoals: true,
          notifyBills: true,
        },
      });

      await tx.account.create({
        data: {
          userId,
          ...DEFAULT_ACCOUNT,
        },
      });

      await tx.category.createMany({
        data: buildDefaultCategories().map((c) => ({
          userId,
          ...c,
        })),
      });
    });

    return {
      purged: true,
      message:
        "Todos os dados financeiros foram apagados. Conta padrão e categorias iniciais recriadas.",
    };
  },
};
