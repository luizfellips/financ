import type { AuthenticatedUser } from "@/server/http/handler";
import { requireUser } from "@/server/http/handler";
import { success } from "@/server/http/response";
import { RateLimitError, ValidationError } from "@/server/errors/app-error";
import { importExportService } from "@/server/services/import-export.service";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { IMPORT_MAX_BYTES } from "@/server/validation/schemas";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const exportQuerySchema = z.object({
  format: z.enum(["csv", "json"]).default("csv"),
});

function fileResponse(
  content: string,
  filename: string,
  mimeType: string,
) {
  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function assertContentLength(request: NextRequest) {
  const raw = request.headers.get("content-length");
  if (!raw) return;
  const length = Number(raw);
  if (Number.isFinite(length) && length > IMPORT_MAX_BYTES) {
    throw new ValidationError(
      `Arquivo muito grande (máximo ${IMPORT_MAX_BYTES} bytes)`,
    );
  }
}

function assertBodySize(content: string) {
  // Approximate UTF-16 string length check; also guard byte-ish size
  if (content.length > IMPORT_MAX_BYTES) {
    throw new ValidationError(
      `Arquivo muito grande (máximo ${IMPORT_MAX_BYTES} bytes)`,
    );
  }
}

function assertImportRestoreRateLimit(
  request: NextRequest,
  userId: string,
  bucket: "import" | "restore",
) {
  const limited = checkRateLimit(`${bucket}:${userId}:${clientIp(request)}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    throw new RateLimitError(limited.retryAfterSec);
  }
}

export const importExportController = {
  async exportData(user: AuthenticatedUser | null, request: NextRequest) {
    const authUser = requireUser(user);
    const query = exportQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries()),
    );

    if (query.format === "json") {
      const result = await importExportService.exportJson(authUser.id);
      return fileResponse(result.content, result.filename, result.mimeType);
    }

    const result = await importExportService.exportCsv(authUser.id);
    return fileResponse(result.content, result.filename, result.mimeType);
  },

  async importData(user: AuthenticatedUser | null, request: NextRequest) {
    const authUser = requireUser(user);
    assertImportRestoreRateLimit(request, authUser.id, "import");
    assertContentLength(request);

    const contentType = request.headers.get("content-type") ?? "";

    let content: string;
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        throw new ValidationError("Arquivo CSV obrigatório (campo file)");
      }
      content = await file.text();
    } else if (
      contentType.includes("text/csv") ||
      contentType.includes("text/plain")
    ) {
      content = await request.text();
    } else {
      const body = await request.json().catch(() => null);
      if (body && typeof body === "object" && "content" in body) {
        content = String((body as { content: string }).content);
      } else {
        throw new ValidationError(
          "Envie um arquivo CSV ou JSON com o campo content",
        );
      }
    }

    assertBodySize(content);
    const data = await importExportService.importCsv(authUser.id, content);
    return success(data);
  },

  async backup(user: AuthenticatedUser | null) {
    const authUser = requireUser(user);
    const result = await importExportService.createBackup(authUser.id);
    return fileResponse(result.content, result.filename, result.mimeType);
  },

  async restore(user: AuthenticatedUser | null, request: NextRequest) {
    const authUser = requireUser(user);
    assertImportRestoreRateLimit(request, authUser.id, "restore");
    assertContentLength(request);

    const contentType = request.headers.get("content-type") ?? "";

    let confirm: string | null = null;
    let backupRaw: unknown;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      confirm = String(form.get("confirm") ?? "");
      const file = form.get("file");
      if (!(file instanceof File)) {
        throw new ValidationError("Arquivo de backup obrigatório (campo file)");
      }
      const text = await file.text();
      assertBodySize(text);
      try {
        backupRaw = JSON.parse(text);
      } catch {
        throw new ValidationError("Arquivo de backup JSON inválido");
      }
    } else {
      const body = await request.json();
      if (!body || typeof body !== "object") {
        throw new ValidationError("Corpo JSON inválido");
      }
      const record = body as Record<string, unknown>;
      confirm = record.confirm != null ? String(record.confirm) : null;

      if ("backup" in record) {
        backupRaw = record.backup;
      } else {
        // Legacy shape: backup fields at root (still require confirm)
        const rest = { ...record };
        delete rest.confirm;
        backupRaw = rest;
      }

      const serialized = JSON.stringify(backupRaw);
      assertBodySize(serialized);
    }

    if (confirm !== "RESTORE") {
      throw new ValidationError(
        'Confirmação obrigatória: envie confirm com o valor "RESTORE"',
      );
    }

    const data = await importExportService.restoreBackup(
      authUser.id,
      backupRaw,
    );
    return success(data);
  },
};
