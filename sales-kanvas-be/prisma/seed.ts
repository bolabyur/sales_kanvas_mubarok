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

const ALL_PERMISSIONS = [
  "plan:read", "plan:create", "plan:update", "plan:delete", "plan:approve", "plan:cancel", "plan:write",
  
  "product:read", "product:create", "product:update", "product:delete", "product:write",
  "batch:read", "batch:create", "batch:update", "batch:delete", "batch:write",
  "gudang:read", "gudang:create", "gudang:update", "gudang:delete", "gudang:write",
  "outlet:read", "outlet:create", "outlet:update", "outlet:delete", "outlet:write",
  "employee:read", "employee:create", "employee:update", "employee:delete", "employee:write",
  "vehicle:read", "vehicle:create", "vehicle:update", "vehicle:delete", "vehicle:write",
  "market-area:read", "market-area:create", "market-area:update", "market-area:delete", "market-area:write",
  "tipe-harga:read", "tipe-harga:create", "tipe-harga:update", "tipe-harga:delete", "tipe-harga:write",
  "user:read", "user:create", "user:update", "user:delete", "user:write",
  "role:read", "role:create", "role:update", "role:delete", "role:write",
  "permission:read",

  "kasbon-produk:read", "kasbon-produk:create", "kasbon-produk:update", "kasbon-produk:delete", "kasbon-produk:approve", "kasbon-produk:cancel", "kasbon-produk:write",
  "kasbon-operasional:read", "kasbon-operasional:create", "kasbon-operasional:update", "kasbon-operasional:delete", "kasbon-operasional:approve", "kasbon-operasional:write",

  "produk-out:read", "produk-out:create", "produk-out:update", "produk-out:delete", "produk-out:write", "produk-out:cancel",
  "produk-in:read", "produk-in:create", "produk-in:update", "produk-in:delete", "produk-in:write",

  "invoice:read", "invoice:create", "invoice:update", "invoice:delete", "invoice:write",
  "pembayaran:read", "pembayaran:create", "pembayaran:update", "pembayaran:delete", "pembayaran:write",
  "settlement:read", "settlement:create", "settlement:update", "settlement:delete", "settlement:write",
  "retur:read", "retur:create", "retur:update", "retur:delete", "retur:write", "retur:approve",
  "kanvas-return:read", "kanvas-return:create", "kanvas-return:update", "kanvas-return:delete", "kanvas-return:write",
  "produk-destruction:read", "produk-destruction:create", "produk-destruction:update", "produk-destruction:delete", "produk-destruction:write",

  "summary:read", "summary:export"
];

const ROLE_MAPPING: Record<string, string[]> = {
  "Super Admin": ALL_PERMISSIONS,
  
  "Supervisor Pemasaran": [
    "plan:read", "plan:approve", "plan:cancel", "plan:write",
    "kasbon-produk:read", "kasbon-produk:approve", "kasbon-produk:update", 
    "invoice:read", "summary:read",
    "retur:read", "retur:approve"
  ],

  "Tim Sales Kanvas": [
    "plan:read", "plan:create", "plan:write",
    "product:read", "outlet:read", "batch:read", "market-area:read", "vehicle:read", "gudang:read",
    "invoice:read", "invoice:create", "invoice:write",
    "pembayaran:read", "pembayaran:create", "pembayaran:write",
    "retur:read", "retur:create", "retur:write", 
    "kasbon-operasional:read", "kasbon-operasional:create", "kasbon-operasional:write",
    "kasbon-produk:read", "kasbon-produk:create", "kasbon-produk:write",
    "settlement:read", "settlement:create", "settlement:write"
  ],

  "Admin Gudang Distribusi": [
    "kasbon-produk:read", "kasbon-produk:update", "kasbon-produk:approve",
    "produk-out:read", "produk-out:create", "produk-out:update", "produk-out:cancel",
    "produk-in:read", "produk-in:create", "produk-in:write", 
    "batch:read", "batch:update", "batch:write",
    "gudang:read",
    "retur:read", "retur:create", "retur:write"
  ],

  "Admin Gudang Retur": [
    "retur:read", "retur:update", "retur:write",
    "kanvas-return:read", "kanvas-return:create", "kanvas-return:update", "kanvas-return:write",
    "produk-destruction:read", "produk-destruction:create", "produk-destruction:write",
    "gudang:read"
  ],

  "Kasir / Tim Keuangan": [
    "settlement:read", "settlement:create", "settlement:update", "settlement:write",
    "pembayaran:read", "pembayaran:create", "pembayaran:write", 
    "invoice:read", 
    "kasbon-operasional:read", "kasbon-operasional:update", "kasbon-operasional:approve", "kasbon-operasional:write",
    "plan:read", "summary:read", "summary:export"
  ]
};

async function main() {
  console.log("Memulai proses seeding...");

  console.log("Membersihkan permission usang...");
  const deletedPerms = await prisma.permission.deleteMany({
    where: { name: { notIn: ALL_PERMISSIONS } }
  });
  console.log(`🧹 ${deletedPerms.count} permission usang dihapus.`);

  for (const name of ALL_PERMISSIONS) {
    await prisma.permission.upsert({ where: { name }, update: {}, create: { name } });
  }

  for (const [roleName, permissions] of Object.entries(ROLE_MAPPING)) {
    const role = await prisma.role.upsert({ 
      where: { name: roleName }, 
      update: {}, 
      create: { name: roleName } 
    });

    await prisma.permissionRole.deleteMany({ where: { role_id: role.id } });

    for (const permName of permissions) {
      const perm = await prisma.permission.findUniqueOrThrow({ where: { name: permName } });
      await prisma.permissionRole.create({
        data: { permission_id: perm.id, role_id: role.id }
      });
    }
    console.log(`✅ Role ${roleName} dibuat dengan ${permissions.length} permission.`);
  }

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

  const roles = await prisma.role.findMany();
  const getRoleId = (name: string) => roles.find(r => r.name === name)!.id;
  const passwordHash = await bcrypt.hash("password", 10);

  await prisma.user.upsert({
    where: { username: "superadmin" },
    update: { karyawan_id: employee.id },
    create: { username: "superadmin", password: passwordHash, name: "Super Administrator", role_id: getRoleId("Super Admin"), karyawan_id: employee.id },
  });
  await prisma.user.upsert({
    where: { username: "sales" },
    update: { karyawan_id: employee.id },
    create: { username: "sales", password: passwordHash, name: "Sales Satu", role_id: getRoleId("Tim Sales Kanvas"), karyawan_id: employee.id },
  });
  await prisma.user.upsert({
    where: { username: "sales2" },
    update: { karyawan_id: employee.id },
    create: { username: "sales2", password: passwordHash, name: "Sales Dua", role_id: getRoleId("Tim Sales Kanvas"), karyawan_id: employee.id },
  });
  await prisma.user.upsert({
    where: { username: "gudang" },
    update: { karyawan_id: employee.id },
    create: { username: "gudang", password: passwordHash, name: "Admin Gudang", role_id: getRoleId("Admin Gudang Distribusi"), karyawan_id: employee.id },
  });
  await prisma.user.upsert({
    where: { username: "kasir" },
    update: { karyawan_id: employee.id },
    create: { username: "kasir", password: passwordHash, name: "Kasir", role_id: getRoleId("Kasir / Tim Keuangan"), karyawan_id: employee.id },
  });

  console.log(`\n🎉 Seeding selesai! User yang tersedia (password: password):`);
  console.log(`   - superadmin, sales, sales2, gudang, kasir`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });