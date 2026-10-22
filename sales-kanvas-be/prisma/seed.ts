import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcrypt";
import * as pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const ROLES = ["Super Admin", "Sales"];

async function main() {
  for (const name of ROLES) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
  }

  const salesRole = await prisma.role.findUniqueOrThrow({ where: { name: "Sales" } });
  
  // DAFTAR PERMISSION GRANULAR
  const permissions = [
    // Plan
    "plan:read", "plan:create", "plan:update", "plan:delete", "plan:approve", "plan:cancel",
    // Master Data
    "market-area:read", "market-area:create", "market-area:update", "market-area:delete",
    "vehicle:read", "vehicle:create", "vehicle:update", "vehicle:delete",
    "product:read", "product:create", "product:update", "product:delete",
    "employee:read", "employee:create", "employee:update", "employee:delete",
    "outlet:read", "outlet:create", "outlet:update", "outlet:delete",
    "tipe-harga:read", "tipe-harga:create", "tipe-harga:update", "tipe-harga:delete",
    "batch:read", "batch:create", "batch:update", "batch:delete",
    // Gudang & Transaksi
    "invoice:read", "invoice:create", "invoice:update", "invoice:delete",
    "kasbon-produk:read", "kasbon-produk:create", "kasbon-produk:update", "kasbon-produk:delete",
    "produk-out:read", "produk-out:create", "produk-out:update", "produk-out:delete",
    "kasbon-operasional:read", "kasbon-operasional:create", "kasbon-operasional:update", "kasbon-operasional:delete",
    "produk-in:read", "produk-in:create", "produk-in:update", "produk-in:delete",
    "settlement:read", "settlement:create", "settlement:update", "settlement:delete",
    "gudang:read", "gudang:create", "gudang:update", "gudang:delete",
    "retur:read", "retur:create", "retur:update", "retur:delete",
    "pembayaran:read", "pembayaran:create", "pembayaran:update", "pembayaran:delete",
    // System
    "user:read", "user:create", "user:update", "user:delete",
    "role:read", "role:create", "role:update", "role:delete",
    "permission:read"
  ];

  for (const name of permissions) {
    const perm = await prisma.permission.upsert({ where: { name }, update: {}, create: { name } });
    await prisma.permissionRole.upsert({
      where: { permission_id_role_id: { permission_id: perm.id, role_id: salesRole.id } },
      update: {}, create: { permission_id: perm.id, role_id: salesRole.id },
    });
  }

  // 3. BUAT DATA KARYAWAN (EMPLOYEE) UNTUK DIHUBUNGKAN KE USER
  const employee = await prisma.employee.upsert({
    where: { nip: "EMP-SYSTEM" },
    update: {},
    create: {
      name: "System Administrator",
      nip: "EMP-SYSTEM",
      employee_position_id: 1,
      employee_job_id: 1,
      employee_contract_id: 1,
      devisi_id: 1,
      gender: "MALE",
      agama: "Islam",
      tgl_lahir: new Date("1990-01-01"),
      tgl_masuk: new Date("2024-01-01"),
      user_id: 1,
      ip: "127.0.0.1",
    },
  });

  // 4. Buat User Sales
  const username = process.env.SEED_USERNAME ?? "sales";
  const password = process.env.SEED_PASSWORD ?? "password";
  const roleName = process.env.SEED_ROLE ?? "Sales";
  const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } });

  const user = await prisma.user.upsert({
    where: { username },
    update: { karyawan_id: employee.id },
    create: {
      username,
      password: await bcrypt.hash(password, 10),
      name: "Nama Sales Admin",
      role_id: role.id,
      karyawan_id: employee.id,
    },
  });

  // 5. Buat User Super Admin
  const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { name: "Super Admin" } });
  await prisma.user.upsert({
    where: { username: "superadmin" },
    update: { karyawan_id: employee.id },
    create: {
      username: "superadmin",
      password: await bcrypt.hash("password", 10),
      name: "Super Administrator",
      role_id: superAdminRole.id,
      karyawan_id: employee.id,
    },
  });

  console.log(`Seeding selesai! Total ${permissions.length} permission granular berhasil dibuat.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());