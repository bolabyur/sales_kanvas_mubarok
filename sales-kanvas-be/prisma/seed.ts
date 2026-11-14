import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcrypt";
import * as pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// ==========================================
// 1. KONFIGURASI PERMISSION & ROLE
// ==========================================
const ALL_PERMISSIONS = [
  "plan:read",
  "plan:create",
  "plan:update",
  "plan:delete",
  "plan:approve",
  "plan:cancel",
  "plan:write",
  "product:read",
  "product:create",
  "product:update",
  "product:delete",
  "product:write",
  "batch:read",
  "batch:create",
  "batch:update",
  "batch:delete",
  "batch:write",
  "gudang:read",
  "gudang:create",
  "gudang:update",
  "gudang:delete",
  "gudang:write",
  "outlet:read",
  "outlet:create",
  "outlet:update",
  "outlet:delete",
  "outlet:write",
  "employee:read",
  "employee:create",
  "employee:update",
  "employee:delete",
  "employee:write",
  "vehicle:read",
  "vehicle:create",
  "vehicle:update",
  "vehicle:delete",
  "vehicle:write",
  "market-area:read",
  "market-area:create",
  "market-area:update",
  "market-area:delete",
  "market-area:write",
  "tipe-harga:read",
  "tipe-harga:create",
  "tipe-harga:update",
  "tipe-harga:delete",
  "tipe-harga:write",
  "user:read",
  "user:create",
  "user:update",
  "user:delete",
  "user:write",
  "role:read",
  "role:create",
  "role:update",
  "role:delete",
  "role:write",
  "permission:read",
  "kasbon-produk:read",
  "kasbon-produk:create",
  "kasbon-produk:update",
  "kasbon-produk:delete",
  "kasbon-produk:approve",
  "kasbon-produk:cancel",
  "kasbon-produk:write",
  "kasbon-operasional:read",
  "kasbon-operasional:create",
  "kasbon-operasional:update",
  "kasbon-operasional:delete",
  "kasbon-operasional:approve",
  "kasbon-operasional:write",
  "produk-out:read",
  "produk-out:create",
  "produk-out:update",
  "produk-out:delete",
  "produk-out:write",
  "produk-out:cancel",
  "produk-in:read",
  "produk-in:create",
  "produk-in:update",
  "produk-in:delete",
  "produk-in:write",
  "invoice:read",
  "invoice:create",
  "invoice:update",
  "invoice:delete",
  "invoice:write",
  "pembayaran:read",
  "pembayaran:create",
  "pembayaran:update",
  "pembayaran:delete",
  "pembayaran:write",
  "settlement:read",
  "settlement:create",
  "settlement:update",
  "settlement:delete",
  "settlement:write",
  "retur:read",
  "retur:create",
  "retur:update",
  "retur:delete",
  "retur:write",
  "retur:approve",
  "retur:receive",
  "kanvas-return:read",
  "kanvas-return:create",
  "kanvas-return:update",
  "kanvas-return:delete",
  "kanvas-return:write",
  "produk-destruction:read",
  "produk-destruction:create",
  "produk-destruction:update",
  "produk-destruction:delete",
  "produk-destruction:write",
  "summary:read",
  "summary:export",
];

const ROLE_MAPPING: Record<string, string[]> = {
  "Super Admin": ALL_PERMISSIONS,
  "Supervisor Pemasaran": [
    "plan:read",
    "plan:approve",
    "plan:cancel",
    "plan:write",
    "kasbon-produk:read",
    "kasbon-produk:approve",
    "kasbon-produk:update",
    "invoice:read",
    "summary:read",
    "retur:read",
    "retur:approve",
  ],
  "Tim Sales Kanvas": [
    "plan:read",
    "plan:create",
    "plan:write",
    "product:read",
    "outlet:read",
    "batch:read",
    "market-area:read",
    "vehicle:read",
    "gudang:read",
    "invoice:read",
    "invoice:create",
    "invoice:write",
    "pembayaran:read",
    "pembayaran:create",
    "pembayaran:write",
    "retur:read",
    "retur:create",
    "retur:write",
    "kasbon-operasional:read",
    "kasbon-operasional:create",
    "kasbon-operasional:write",
    "kasbon-produk:read",
    "kasbon-produk:create",
    "kasbon-produk:write",
    "settlement:read",
    "settlement:create",
    "settlement:write",
  ],
  "Admin Gudang Distribusi": [
    "kasbon-produk:read",
    "kasbon-produk:update",
    "kasbon-produk:approve",
    "produk-out:read",
    "produk-out:create",
    "produk-out:update",
    "produk-out:cancel",
    "produk-in:read",
    "produk-in:create",
    "produk-in:write",
    "batch:read",
    "batch:update",
    "batch:write",
    "gudang:read",
    "retur:read",
    "retur:create",
    "retur:write",
    "retur:update",
    "retur:receive",
  ],
  "Admin Gudang Retur": [
    "retur:read",
    "retur:update",
    "retur:write",
    "retur:receive",
    "kanvas-return:read",
    "kanvas-return:create",
    "kanvas-return:update",
    "kanvas-return:write",
    "produk-destruction:read",
    "produk-destruction:create",
    "produk-destruction:write",
    "gudang:read",
  ],
  "Kasir / Tim Keuangan": [
    "settlement:read",
    "settlement:create",
    "settlement:update",
    "settlement:write",
    "pembayaran:read",
    "pembayaran:create",
    "pembayaran:write",
    "invoice:read",
    "kasbon-operasional:read",
    "kasbon-operasional:update",
    "kasbon-operasional:approve",
    "kasbon-operasional:write",
    "plan:read",
    "summary:read",
    "summary:export",
  ],
};

// ==========================================
// Helper: idempotent find-or-create
// ==========================================
async function findOrCreate<T>(
  findFn: () => Promise<T | null>,
  createFn: () => Promise<T>,
): Promise<T> {
  const existing = await findFn();
  if (existing) return existing;
  return createFn();
}

async function main() {
  console.log("🚀 MEMULAI SEEDING (idempotent)...");

  // 1. PERMISSIONS & ROLES
  for (const name of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  for (const [roleName, permissions] of Object.entries(ROLE_MAPPING)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
    await prisma.permissionRole.deleteMany({ where: { role_id: role.id } });
    for (const permName of permissions) {
      const perm = await prisma.permission.findUniqueOrThrow({
        where: { name: permName },
      });
      await prisma.permissionRole.create({
        data: { permission_id: perm.id, role_id: role.id },
      });
    }
  }

  // 2. USERS + EMPLOYEE
  const passwordHash = await bcrypt.hash("password", 10);

  // Employee — safe: cek dua NIP (lama & baru) agar tidak orphan
  let employee = await prisma.employee.findFirst({
    where: { nip: { in: ["EMP-SYSTEM", "EMP-SYS"] } },
  });
  if (!employee) {
    employee = await prisma.employee.create({
      data: {
        name: "System Admin",
        nip: "EMP-SYS",
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
  }

  const roles = await prisma.role.findMany();
  const getRoleId = (name: string) => roles.find((r) => r.name === name)!.id;

  const users = [
    { u: "superadmin", r: "Super Admin", n: "Super Admin" },
    { u: "spv", r: "Supervisor Pemasaran", n: "Supervisor" },
    { u: "sales", r: "Tim Sales Kanvas", n: "Sales Satu" },
    { u: "gudang", r: "Admin Gudang Distribusi", n: "Admin Gudang" },
    { u: "kasir", r: "Kasir / Tim Keuangan", n: "Kasir" },
  ];
  for (const user of users) {
    await prisma.user.upsert({
      where: { username: user.u },
      update: { role_id: getRoleId(user.r) },
      create: {
        username: user.u,
        password: passwordHash,
        name: user.n,
        role_id: getRoleId(user.r),
        karyawan_id: employee.id,
      },
    });
  }
  console.log("✅ User & Role siap (Password: 'password').");

  // ==========================================
  // 3. MASTER DATA — IDEMPOTENT (safe re-run)
  // ==========================================
  console.log("⏳ Master data (idempotent)...");

  // Timestamp STABIL agar re-run idempotent — pakai env atau hardcode
  const timestamp = process.env.SEED_TIMESTAMP || "000001";

  // Gudang — no unique on nama_gudang → findOrCreate
  const gudang = await findOrCreate(
    () =>
      prisma.gudang.findFirst({
        where: { nama_gudang: `Gudang Utama ${timestamp}` },
      }),
    () =>
      prisma.gudang.create({
        data: {
          nama_gudang: `Gudang Utama ${timestamp}`,
          tipe_gudang: "Barang Jadi",
        },
      }),
  );

  // Vehicele — nopol @unique → upsert
  const vehicle = await prisma.vehicele.upsert({
    where: { nopol: `K ${timestamp} AB` },
    update: {},
    create: {
      name: `Truk Fuso`,
      nopol: `K ${timestamp} AB`,
      type_vehicle: "Truk",
      type_fuel: "Solar",
      user_id: 1,
      ip: "127.0.0.1",
    },
  });

  // MarketArea — name @unique → upsert
  const area = await prisma.marketArea.upsert({
    where: { name: `Area Otomatis ${timestamp}` },
    update: {},
    create: { name: `Area Otomatis ${timestamp}`, user_id: 1, ip: "127.0.0.1" },
  });

  // TipeHarga — no unique on nama_tipe → findOrCreate
  const tipeHarga = await findOrCreate(
    () =>
      prisma.tipeHarga.findFirst({
        where: { nama_tipe: `Harga Retail ${timestamp}` },
      }),
    () =>
      prisma.tipeHarga.create({
        data: { nama_tipe: `Harga Retail ${timestamp}` },
      }),
  );

  // Outlet — no unique on nama_toko → findOrCreate
  const outlet = await findOrCreate(
    () =>
      prisma.outlet.findFirst({
        where: { nama_toko: `Toko Otomatis ${timestamp}` },
      }),
    () =>
      prisma.outlet.create({
        data: {
          nama_toko: `Toko Otomatis ${timestamp}`,
          alamat: "Jl. Auto No. 1",
          tipe_harga_id: tipeHarga.id,
        },
      }),
  );

  // Produk A — findOrCreate by code
  const prodA = await findOrCreate(
    () => prisma.product.findFirst({ where: { code: `PRD-A-${timestamp}` } }),
    () =>
      prisma.product.create({
        data: {
          name: `Produk A ${timestamp}`,
          code: `PRD-A-${timestamp}`,
          barcode: `111${timestamp}`,
          product_brand_id: 1,
          product_type_id: 1,
          sale_report_group_id: 1,
          supplier_id: 1,
          is_active: true,
          type_price: "FIXED",
          user_id: 1,
          ip: "127.0.0.1",
        },
      }),
  );
  const prodB = await findOrCreate(
    () => prisma.product.findFirst({ where: { code: `PRD-B-${timestamp}` } }),
    () =>
      prisma.product.create({
        data: {
          name: `Produk B ${timestamp}`,
          code: `PRD-B-${timestamp}`,
          barcode: `222${timestamp}`,
          product_brand_id: 1,
          product_type_id: 1,
          sale_report_group_id: 1,
          supplier_id: 1,
          is_active: true,
          type_price: "FIXED",
          user_id: 1,
          ip: "127.0.0.1",
        },
      }),
  );

  // ProdukHarga — no composite unique → findOrCreate per (produk, tipe)
  await findOrCreate(
    () =>
      prisma.produkHarga.findFirst({
        where: { produk_id: prodA.id, tipe_harga_id: tipeHarga.id },
      }),
    () =>
      prisma.produkHarga.create({
        data: {
          produk_id: prodA.id,
          tipe_harga_id: tipeHarga.id,
          harga: 10000,
        },
      }),
  );
  await findOrCreate(
    () =>
      prisma.produkHarga.findFirst({
        where: { produk_id: prodB.id, tipe_harga_id: tipeHarga.id },
      }),
    () =>
      prisma.produkHarga.create({
        data: {
          produk_id: prodB.id,
          tipe_harga_id: tipeHarga.id,
          harga: 20000,
        },
      }),
  );

  // Batch — no unique on no_batch → findOrCreate per (produk, no_batch)
  await findOrCreate(
    () =>
      prisma.batch.findFirst({
        where: { produk_id: prodA.id, no_batch: `BCH-A1-${timestamp}` },
      }),
    () =>
      prisma.batch.create({
        data: {
          produk_id: prodA.id,
          no_batch: `BCH-A1-${timestamp}`,
          expired_date: new Date("2025-12-31"),
          stok_gudang: 100,
        },
      }),
  );
  await findOrCreate(
    () =>
      prisma.batch.findFirst({
        where: { produk_id: prodA.id, no_batch: `BCH-A2-${timestamp}` },
      }),
    () =>
      prisma.batch.create({
        data: {
          produk_id: prodA.id,
          no_batch: `BCH-A2-${timestamp}`,
          expired_date: new Date("2026-12-31"),
          stok_gudang: 50,
        },
      }),
  );
  await findOrCreate(
    () =>
      prisma.batch.findFirst({
        where: { produk_id: prodB.id, no_batch: `BCH-B1-${timestamp}` },
      }),
    () =>
      prisma.batch.create({
        data: {
          produk_id: prodB.id,
          no_batch: `BCH-B1-${timestamp}`,
          expired_date: new Date("2025-10-31"),
          stok_gudang: 200,
        },
      }),
  );

  console.log("✅ Master Data & Inventory idempotent — aman di-run berulang.");
  console.log(`\n🎉 SEEDING SELESAI!`);
  console.log(`   Login: sales / password, superadmin / password`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
