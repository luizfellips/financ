import { NotFoundError } from "@/server/errors/app-error";
import { settingsRepository } from "@/server/repositories/settings.repository";
import type { z } from "zod";
import type { settingsSchema } from "@/server/validation/schemas";

type SettingsInput = z.infer<typeof settingsSchema>;

function mapSettings<T extends { createdAt: Date; updatedAt: Date }>(
  settings: T,
) {
  return {
    ...settings,
    createdAt: settings.createdAt.toISOString(),
    updatedAt: settings.updatedAt.toISOString(),
  };
}

export const settingsService = {
  async get(userId: string) {
    let settings = await settingsRepository.findByUser(userId);
    if (!settings) {
      settings = await settingsRepository.createDefault(userId);
    }
    return mapSettings(settings);
  },

  async update(userId: string, input: SettingsInput) {
    const settings = await settingsRepository.update(userId, {
      ...(input.theme !== undefined ? { theme: input.theme } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(input.locale !== undefined ? { locale: input.locale } : {}),
      ...(input.monthStartDay !== undefined
        ? { monthStartDay: input.monthStartDay }
        : {}),
      ...(input.notifyBudget !== undefined
        ? { notifyBudget: input.notifyBudget }
        : {}),
      ...(input.notifyGoals !== undefined
        ? { notifyGoals: input.notifyGoals }
        : {}),
      ...(input.notifyBills !== undefined
        ? { notifyBills: input.notifyBills }
        : {}),
    });

    if (!settings) {
      throw new NotFoundError("Configurações não encontradas");
    }

    return mapSettings(settings);
  },
};
