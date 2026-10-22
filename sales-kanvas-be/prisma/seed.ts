import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcrypt";
import * as pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// ==========================================
// 1. DEFINISI SEMUA PERMISSION (GRANULAR)
// ==========================================
const ALL_PERMISSIONS = [
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

// ==========================================
// 2. DEFINISI ROLE & PERMISSION (SESUAI PRD)
// ==========================================
const ROLE_MAPPING: Record<string, string[]> = {
  // Super Admin bebas akses semua (bypass di guard), tapi kita beri semua permission agar aman
  "Super Admin": ALL_PERMISSIONS,
  
  // Supervisor: Approve Plan & BON, Lihat Laporan
  "Supervisor Pemasaran": [
    "plan:read", "plan:approve", "plan:cancel",
    "kasbon-produk:read", "kasbon-produk:update",
    "invoice:read"
  ],

  // Sales: Buat Plan, Jual, Tagih Piutang, Retur, Kasbon Jalan
  "Tim Sales Kanvas": [
    "plan:read", "plan:create",
    "product:read", "outlet:read", "batch:read", "market-area:read", "vehicle:read",
    "invoice:read", "invoice:create", 
    "pembayaran:read", "pembayaran:create",
    "retur:read", "retur:create",
    "kasbon-operasional:read", "kasbon-operasional:create"
  ],

  // Admin Gudang: Siapkan Barang, Loading, Unloading
  "Admin Gudang Distribusi": [
    "kasbon-produk:read", "kasbon-produk:update", // Update untuk penyesuaian stok
    "produk-out:read", "produk-out:create", // Loading
    "produk-in:read", "produk-in:create", // Unloading
    "batch:read", "batch:update",
    "gudang:read"
  ],

  // Admin Gudang Retur: Verifikasi Barang Rusak/Expired
  "Admin Gudang Retur": [
    "retur:read", "retur:update", 
    "gudang:read"
  ],

  // Kasir / Keuangan: Totalan (Settlement), Verifikasi Kasbon & Piutang
  "Kasir / Tim Keuangan": [
    "settlement:read", "settlement:create", "settlement:update",
    "pembayaran:read",
    "kasbon-operasional:read", "kasbon-operasional:update",
    "plan:read"
  ]
};

async function main() {
  console.log("Memulai proses seeding...");

  // 3. BUAT PERMISSIONS
  for (const name of ALL_PERMISSIONS) {
    await prisma.permission.upsert({ where: { name }, update: {}, create: { name } });
  }

  // 4. BUAT ROLES & HUBUNGKAN PERMISSION
  for (const [roleName, permissions] of Object.entries(ROLE_MAPPING)) {
    const role = await prisma.role.upsert({ 
      where: { name: roleName }, 
      update: {}, 
      create: { name: roleName } 
    });

    // Hapus permission lama (jika role sudah ada sebelumnya) agar tidak duplikat
    await prisma.permissionRole.deleteMany({ where: { role_id: role.id } });

    // Masukkan permission baru
    for (const permName of permissions) {
      const perm = await prisma.permission.findUniqueOrThrow({ where: { name: permName } });
      await prisma.permissionRole.create({
        data: { permission_id: perm.id, role_id: role.id }
      });
    }
    console.log(`✅ Role ${roleName} dibuat dengan ${permissions.length} permission.`);
  }

  // 5. BUAT DATA KARYAWAN (EMPLOYEE) UNTUK DIHUBUNGKAN KE USER
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

  // 6. BUAT USER DEFAULT (Superadmin & Sales)
  const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { name: "Super Admin" } });
  const salesRole = await prisma.role.findUniqueOrThrow({ where: { name: "Tim Sales Kanvas" } });

  // User Superadmin
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

  // User Sales
  await prisma.user.upsert({
    where: { username: "sales" },
    update: { karyawan_id: employee.id, role_id: salesRole.id },
    create: {
      username: "sales",
      password: await bcrypt.hash("password", 10),
      name: "Nama Sales Admin",
      role_id: salesRole.id,
      karyawan_id: employee.id,
    },
  });

  console.log(`\n🎉 Seeding selesai! Silakan login dengan:`);
  console.log(`   - Superadmin (password: password)`);
  console.log(`   - Sales (password: password)`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());