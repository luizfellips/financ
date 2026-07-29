import type { AuthenticatedUser } from "@/server/http/handler";
import { requireUser } from "@/server/http/handler";
import { success } from "@/server/http/response";
import { ValidationError } from "@/server/errors/app-error";
import { importExportService } from "@/server/services/import-export.service";
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
    const contentType = request.headers.get("content-type") ?? "";

    let content: string;
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        throw new ValidationError("Arquivo CSV obrigatório (campo file)");
      }
      content = await file.text();
    } else if (contentType.includes("text/csv") || contentType.includes("text/plain")) {
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
    const contentType = request.headers.get("content-type") ?? "";

    let payload: unknown;
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        throw new ValidationError("Arquivo de backup obrigatório (campo file)");
      }
      const text = await file.text();
      try {
        payload = JSON.parse(text);
      } catch {
        throw new ValidationError("Arquivo de backup JSON inválido");
      }
    } else {
      payload = await request.json();
    }

    const data = await importExportService.restoreBackup(authUser.id, payload);
    return success(data);
  },
};
