<<<<<<< HEAD
# sales-kanvas-be

## Setup

```bash
npm install
cp .env.example .env          # isi DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET
npx prisma migrate dev        # terapkan migration + generate client
npm run start:dev             # http://localhost:53103/api
```

### Environment

| Variabel                 | Default | Keterangan                              |
| ------------------------ | ------- | --------------------------------------- |
| `PORT`                   | `53103` | Port HTTP                               |
| `NODE_ENV`               | -       | `development` / `production`            |
| `DATABASE_URL`           | -       | Connection string PostgreSQL            |
| `JWT_SECRET`             | -       | Secret access token                     |
| `JWT_ACCESS_EXPIRES_IN`  | `15m`   | Umur access token                       |
| `JWT_REFRESH_SECRET`     | -       | Secret refresh token (beda dari access) |
| `JWT_REFRESH_EXPIRES_IN` | `30d`   | Umur refresh token                      |

### Script

| Perintah             | Fungsi                                                         |
| -------------------- | -------------------------------------------------------------- |
| `npm run start:dev`  | Dev server (watch)                                             |
| `npm run build`      | Build ke `dist/`                                               |
| `npm run start:prod` | Jalankan hasil build                                           |
| `npm run lint`       | ESLint + autofix                                               |
| `npm test`           | Jest (`*.spec.ts` di `src/`)                                   |
| `npm run db:fresh`   | ⚠️ Reset DB (hapus semua data) + migrate + generate — dev saja |

> Setelah mengubah `prisma/schema.prisma`, jalankan `npx prisma migrate dev --name <nama>` lalu **restart** dev server — `--watch` tidak memuat ulang Prisma Client yang baru di-generate.

## Struktur

```
src/
├── auth/        # login, refresh, logout, me + JwtStrategy/JwtAuthGuard
├── common/      # PermissionsGuard, @RequirePermission, @Authenticated, filter error, response interceptor
├── master/      # employee, market-area, product, vehicle, kasbon-material-type
├── plan/        # Sales Kanvas Plan (detail produk, personil, kasbon material)
└── prisma/      # PrismaService
```

## Format response

Semua response sukses dibungkus `ResponseInterceptor`

Error dinormalisasi oleh `AllExceptionsFilter` (termasuk error validasi Zod) dan `PrismaExceptionFilter`.

## Autentikasi

| Method | Path            | Auth   | Body                     |
| ------ | --------------- | ------ | ------------------------ |
| POST   | `/auth/login`   | -      | `{ username, password }` |
| POST   | `/auth/refresh` | -      | `{ refresh_token }`      |
| POST   | `/auth/logout`  | Bearer | -                        |
| GET    | `/auth/me`      | Bearer | -                        |

- Login mengembalikan `access_token`, `refresh_token`, dan `user` (termasuk `role: { id, name }` dan `permissions: [{ id, name }]`, mis. `{ "id": 1, "name": "plan:read" }`).
- Android menyimpan token di `EncryptedSharedPreferences` dan mengirim `Authorization: Bearer <access_token>`.
- Refresh token **dirotasi** tiap dipakai. Memakai ulang refresh token lama = seluruh sesi user itu di-revoke.

## Otorisasi (Role & Permission)

- User → satu `Role` → banyak `Permission` (tabel `permission_role`).
- Setiap endpoint di belakang `JwtAuthGuard` **wajib** diberi salah satu:
  - `@Authenticated()` — cukup login;
  - `@RequirePermission('resource:action')` — butuh permission tertentu.

  Endpoint tanpa keduanya **ditolak** (fail-closed).

- Wildcard didukung: `plan:*` mencakup `plan:read` & `plan:write`.
- **Super Admin** (role `Super Admin`/`superadmin`, atau `role_id = 1`) melewati semua cek permission.

## Endpoint

Semua di bawah prefix `/api`, semuanya butuh Bearer token.

### Master

| Resource                       | GET list & `/:id` | POST / PATCH `/:id`          | DELETE `/:id`                |
| ------------------------------ | ----------------- | ---------------------------- | ---------------------------- |
| `/master/employee`             | login             | `employee:write`             | —                            |
| `/master/market-area`          | login             | `market-area:write`          | `market-area:write`          |
| `/master/product`              | login             | `product:write`              | `product:write`              |
| `/master/vehicle`              | login             | `vehicle:write`              | `vehicle:write`              |
| `/master/kasbon-material-type` | login             | `kasbon-material-type:write` | `kasbon-material-type:write` |
=======
# sales_kanvas_mubarok
>>>>>>> ad7774f5ae51ddd00a88a933ec6b8920fd156341
