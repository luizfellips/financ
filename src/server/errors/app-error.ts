export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Array<{ path: string; message: string }>;

  constructor(
    message: string,
    options: {
      status?: number;
      code?: string;
      details?: Array<{ path: string; message: string }>;
    } = {},
  ) {
    super(message);
    this.name = "AppError";
    this.status = options.status ?? 500;
    this.code = options.code ?? "INTERNAL_ERROR";
    this.details = options.details;
  }
}

export class ValidationError extends AppError {
  constructor(
    message = "Dados inválidos",
    details?: Array<{ path: string; message: string }>,
  ) {
    super(message, { status: 400, code: "VALIDATION_ERROR", details });
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Não autenticado") {
    super(message, { status: 401, code: "UNAUTHORIZED" });
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Acesso negado") {
    super(message, { status: 403, code: "FORBIDDEN" });
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Recurso não encontrado") {
    super(message, { status: 404, code: "NOT_FOUND" });
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflito de dados") {
    super(message, { status: 409, code: "CONFLICT" });
    this.name = "ConflictError";
  }
}

export class RateLimitError extends AppError {
  readonly retryAfterSec: number;

  constructor(retryAfterSec: number, message = "Muitas tentativas. Tente novamente mais tarde.") {
    super(message, { status: 429, code: "RATE_LIMITED" });
    this.name = "RateLimitError";
    this.retryAfterSec = retryAfterSec;
  }
}
