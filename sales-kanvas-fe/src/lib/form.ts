import { ApiError } from "./api";

export type FieldErrors = Record<string, string>;

export function fieldErrors(e: unknown): FieldErrors {
  if (!(e instanceof ApiError) || !Array.isArray(e.errors)) return {};
  const issues = e.errors as { path: (string | number)[]; message: string }[];
  return Object.fromEntries(
    issues
      .filter((i) => i.path.length)
      .map((i) => [i.path.join("."), i.message]),
  );
}

export const text = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
export const textOrNull = (fd: FormData, k: string) => text(fd, k) || null;
export const num = (fd: FormData, k: string) => Number(text(fd, k));
export const numOrNull = (fd: FormData, k: string) =>
  text(fd, k) === "" ? null : num(fd, k);
export const bool = (fd: FormData, k: string) => fd.get(k) === "on";
