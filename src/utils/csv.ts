import Papa from "papaparse";

export function toCsv<T extends Record<string, unknown>>(rows: T[]): string {
  return Papa.unparse(rows);
}

export function parseCsv<T extends Record<string, unknown>>(
  content: string,
): { data: T[]; errors: string[] } {
  const result = Papa.parse<T>(content, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  const errors = result.errors.map(
    (error) => `Linha ${error.row ?? "?"}: ${error.message}`,
  );

  return { data: result.data, errors };
}

export function downloadBlob(filename: string, content: string, mime: string) {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
