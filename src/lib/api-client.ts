import type { ApiResponse, PaginationMeta } from "@/types/api";

export class ApiError extends Error {
  code: string;
  details?: Array<{ path: string; message: string }>;
  status: number;

  constructor(
    code: string,
    message: string,
    status = 400,
    details?: Array<{ path: string; message: string }>,
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

type QueryValue = string | number | boolean | null | undefined;

function buildUrl(
  path: string,
  params?: Record<string, QueryValue>,
): string {
  if (!params) return path;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

export type ApiResult<T> = {
  data: T;
  meta?: PaginationMeta;
};

export async function apiClient<T>(
  path: string,
  options: RequestInit & {
    params?: Record<string, QueryValue>;
  } = {},
): Promise<ApiResult<T>> {
  const { params, headers, ...init } = options;
  const url = buildUrl(path, params);

  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
  });

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    if (!response.ok) {
      throw new ApiError(
        "HTTP_ERROR",
        `Erro HTTP ${response.status}`,
        response.status,
      );
    }
    throw new ApiError(
      "INVALID_RESPONSE",
      "Resposta inesperada do servidor",
      response.status,
    );
  }

  const payload = (await response.json()) as ApiResponse<T>;

  if (!payload.success) {
    throw new ApiError(
      payload.error.code,
      payload.error.message,
      response.status,
      payload.error.details,
    );
  }

  return { data: payload.data, meta: payload.meta };
}

export async function downloadFile(
  path: string,
  params?: Record<string, QueryValue>,
  fallbackFilename = "download",
): Promise<void> {
  const url = buildUrl(path, params);
  const response = await fetch(url, { headers: { Accept: "*/*" } });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const payload = (await response.json()) as ApiResponse<never>;
      if (!payload.success) {
        throw new ApiError(
          payload.error.code,
          payload.error.message,
          response.status,
          payload.error.details,
        );
      }
    }
    throw new ApiError("HTTP_ERROR", `Erro HTTP ${response.status}`, response.status);
  }

  const disposition = response.headers.get("content-disposition");
  let filename = fallbackFilename;
  const match = disposition?.match(/filename="?([^"]+)"?/i);
  if (match?.[1]) filename = match[1];

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
