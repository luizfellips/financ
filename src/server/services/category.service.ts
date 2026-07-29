import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/server/errors/app-error";
import { categoryRepository } from "@/server/repositories/category.repository";
import type { TransactionType } from "@prisma/client";
import type { z } from "zod";
import type { categorySchema } from "@/server/validation/schemas";

type CategoryInput = z.infer<typeof categorySchema>;

function mapCategory<T extends {
  createdAt: Date;
  updatedAt: Date;
}>(category: T) {
  return {
    ...category,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

export const categoryService = {
  async list(userId: string, type?: TransactionType) {
    const categories = await categoryRepository.findManyByUser(userId, {
      type,
    });
    return categories.map(mapCategory);
  },

  async getById(userId: string, id: string) {
    const category = await categoryRepository.findById(userId, id);
    if (!category) {
      throw new NotFoundError("Categoria não encontrada");
    }
    return mapCategory(category);
  },

  async create(userId: string, input: CategoryInput) {
    const existing = await categoryRepository.findByNameAndType(
      userId,
      input.name,
      input.type,
    );
    if (existing) {
      throw new ConflictError(
        "Já existe uma categoria com este nome e tipo",
      );
    }

    const category = await categoryRepository.create(userId, {
      name: input.name,
      type: input.type,
      color: input.color,
      icon: input.icon,
      isSystem: false,
    });

    return mapCategory(category);
  },

  async update(userId: string, id: string, input: Partial<CategoryInput>) {
    const existing = await categoryRepository.findById(userId, id);
    if (!existing) {
      throw new NotFoundError("Categoria não encontrada");
    }

    if (existing.isSystem && input.name && input.name !== existing.name) {
      throw new ValidationError(
        "Não é possível renomear categorias do sistema",
      );
    }

    if (input.name && input.name !== existing.name) {
      const duplicate = await categoryRepository.findByNameAndType(
        userId,
        input.name,
        existing.type,
      );
      if (duplicate) {
        throw new ConflictError(
          "Já existe uma categoria com este nome e tipo",
        );
      }
    }

    const category = await categoryRepository.update(userId, id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
      ...(input.icon !== undefined ? { icon: input.icon } : {}),
    });

    return mapCategory(category);
  },

  async delete(userId: string, id: string) {
    const existing = await categoryRepository.findById(userId, id);
    if (!existing) {
      throw new NotFoundError("Categoria não encontrada");
    }

    if (existing.isSystem) {
      throw new ValidationError(
        "Não é possível excluir categorias do sistema",
      );
    }

    const [txCount, budgetCount] = await Promise.all([
      categoryRepository.countTransactions(userId, id),
      categoryRepository.countBudgets(userId, id),
    ]);

    if (txCount > 0 || budgetCount > 0) {
      throw new ConflictError(
        "Não é possível excluir uma categoria com transações ou orçamentos vinculados",
      );
    }

    await categoryRepository.delete(userId, id);
    return { id };
  },
};
