import { ApiError } from "./api";

const MESSAGES: Record<string, string> = {
  "Invalid credentials": "Username atau password salah",
  "Account is not active": "Akun Anda tidak aktif",
  "Invalid or expired refresh token": "Sesi berakhir, silakan login kembali",
  "Refresh token reuse detected": "Sesi berakhir, silakan login kembali",
  "User not found": "Akun tidak ditemukan",
  "Validation failed": "Periksa kembali isian form",
  "Invalid reference": "Data masih dipakai atau referensi tidak valid",
  "Record not found": "Data tidak ditemukan",
  "Invalid data provided": "Data yang dikirim tidak valid",
};

/** Untuk mengubah error (API / jaringan) jadi pesan untuk user. */
export function errorMessage(e: unknown): string {
  if (!(e instanceof ApiError)) return "Tidak dapat terhubung ke server";
  if (MESSAGES[e.message]) return MESSAGES[e.message];
  if (e.status === 403) return "Anda tidak punya akses untuk aksi ini";
  if (e.status === 409)
    return `Data sudah ada (${e.message.replace(" already exists", "")})`;
  if (e.status >= 500) return "Terjadi kesalahan di server, coba lagi nanti";
  return e.message;
}
