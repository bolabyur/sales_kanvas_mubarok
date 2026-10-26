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
  "plan:read", "plan:create", "plan:update", "plan:delete", "plan:approve", "plan:cancel",
  "market-area:read", "market-area:create", "market-area:update", "market-area:delete",
  "vehicle:read", "vehicle:create", "vehicle:update", "vehicle:delete",
  "product:read", "product:create", "product:update", "product:delete",
  "employee:read", "employee:create", "employee:update", "employee:delete",
  "outlet:read", "outlet:create", "outlet:update", "outlet:delete",
  "tipe-harga:read", "tipe-harga:create", "tipe-harga:update", "tipe-harga:delete",
  "batch:read", "batch:create", "batch:update", "batch:delete",
  "gudang:read", "gudang:create", "gudang:update", "gudang:delete",
  "invoice:read", "invoice:create", "invoice:update", "invoice:delete",
  "kasbon-produk:read", "kasbon-produk:create", "kasbon-produk:update", "kasbon-produk:delete",
  "produk-out:read", "produk-out:create", "produk-out:update", "produk-out:delete",
  "kasbon-operasional:read", "kasbon-operasional:create", "kasbon-operasional:update", "kasbon-operasional:delete",
  "produk-in:read", "produk-in:create", "produk-in:update", "produk-in:delete",
  "settlement:read", "settlement:create", "settlement:update", "settlement:delete",
  "retur:read", "retur:create", "retur:update", "retur:delete",
  "pembayaran:read", "pembayaran:create", "pembayaran:write", "pembayaran:update", "pembayaran:delete",
  "user:read", "user:create", "user:update", "user:delete",
  "role:read", "role:create", "role:update", "role:delete",
  "permission:read"
];

const ROLE_MAPPING: Record<string, string[]> = {
  "Super Admin": ALL_PERMISSIONS,
  
  "Supervisor Pemasaran": [
    "plan:read", "plan:approve", "plan:cancel",
    "kasbon-produk:read", "kasbon-produk:update",
    "invoice:read"
  ],

  "Tim Sales Kanvas": [
    "plan:read", "plan:create",
    "product:read", "outlet:read", "batch:read", "market-area:read", "vehicle:read",
    "invoice:read", "invoice:create", 
    "pembayaran:read", "pembayaran:create",
    "retur:read", "retur:create",
    "kasbon-operasional:read", "kasbon-operasional:create",
    "kasbon-produk:read", "kasbon-produk:create"
  ],

  "Admin Gudang Distribusi": [
    "kasbon-produk:read", "kasbon-produk:update", 
    "produk-out:read", "produk-out:create",
    "produk-in:read", "produk-in:create", 
    "batch:read", "batch:update",
    "gudang:read",
    "retur:read", "retur:create", "retur:write" 
  ],

  "Admin Gudang Retur": [
    "retur:read", "retur:update", 
    "gudang:read"
  ],

  "Kasir / Tim Keuangan": [
    "settlement:read", "settlement:create", "settlement:update",
    "pembayaran:read", "pembayaran:create", "pembayaran:write", 
    "invoice:read", 
    "kasbon-operasional:read", "kasbon-operasional:update",
    "plan:read"
  ]
};

async function main() {
  console.log("Memulai proses seeding...");

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