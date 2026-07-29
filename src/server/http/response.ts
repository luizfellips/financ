import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import type { ApiResponse, FieldIssue, PaginationMeta } from "@/types/api";
import { AppError, RateLimitError } from "@/server/errors/app-error";

function zodIssues(error: ZodError): FieldIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.join(".") || "root",
    message: issue.message,
  }));
}

export function success<T>(
  data: T,
  init?: { status?: number; meta?: PaginationMeta },
) {
  const body: ApiResponse<T> = {
    success: true,
    data,
    ...(init?.meta ? { meta: init.meta } : {}),
  };
  return NextResponse.json(body, { status: init?.status ?? 200 });
}

export function failure(
  error: {
    code: string;
    message: string;
    details?: FieldIssue[];
  },
  status = 400,
  headers?: HeadersInit,
) {
  const body: ApiResponse<never> = {
    success: false,
    error,
  };
  return NextResponse.json(body, { status, headers });
}

export function handleRouteError(error: unknown) {
  if (error instanceof RateLimitError) {
    return failure(
      {
        code: error.code,
        message: error.message,
      },
      429,
      { "Retry-After": String(error.retryAfterSec) },
    );
  }

  if (error instanceof AppError) {
    return failure(
      {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      error.status,
    );
  }

  if (error instanceof ZodError) {
    return failure(
      {
        code: "VALIDATION_ERROR",
        message: "Dados inválidos",
        details: zodIssues(error),
      },
      400,
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return failure(
        {
          code: "CONFLICT",
          message: "Já existe um registro com esses dados",
        },
        409,
      );
    }
    if (error.code === "P2025") {
      return failure(
        {
          code: "NOT_FOUND",
          message: "Registro não encontrado",
        },
        404,
      );
    }
  }

  console.error("[API Error]", error);
  return failure(
    {
      code: "INTERNAL_ERROR",
      message: "Erro interno do servidor",
    },
    500,
  );
}
