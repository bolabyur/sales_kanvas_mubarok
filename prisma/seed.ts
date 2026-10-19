import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcrypt";
import * as pg from "pg";
import { read, write } from "fs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// "Super Admin" dibuat lebih dulu supaya konsisten dapat id=1 di DB baru —
// PermissionsGuard pakai role.id === 1 sebagai salah satu fallback bypass.
const ROLES = ["Super Admin", "Sales"];

async function main() {
  for (const name of ROLES) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
  }

  // Role Sales boleh baca & tulis plan (Super Admin bypass di PermissionsGuard).
  const sales = await prisma.role.findUniqueOrThrow({
    where: { name: "Sales" },
  });
  for (const name of [
    "plan:read",
    "plan:write",
    "market-area:write",
    "vehicle:write",
    "product:write",
    "employee:write",
    "outlet:read",
    "outlet:write",
    "tipe-harga:read",
    "tipe-harga:write",
    "batch:read",
    "batch:write",
    "invoice:write",
    "invoice:read",
    "kasbon-produk:write", 
    "kasbon-produk:read",
    "produk-out:write", 
    "produk-out:read",
    "kasbon-operasional:write", 
    "kasbon-operasional:read",
    "produk-in:write", 
    "produk-in:read",
    "settlement:write", 
    "settlement:read",
    "gudang:read", 
    "gudang:write", 
    "produk-harga:read",
    "produk-harga:write", 
    "plan-outlet:read", 
    "plan-outlet:write", 
    "retur:read", 
    "retur:write",
    "pembayaran:write",
    "pembayaran:seed"
  ]) {
    const perm = await prisma.permission.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    await prisma.permissionRole.upsert({
      where: {
        permission_id_role_id: { permission_id: perm.id, role_id: sales.id },
      },
      update: {},
      create: { permission_id: perm.id, role_id: sales.id },
    });
  }

  const username = process.env.SEED_USERNAME ?? "sales";
  const password = process.env.SEED_PASSWORD ?? "password";
  const roleName = process.env.SEED_ROLE ?? "Sales";

  const role = await prisma.role.findUniqueOrThrow({
    where: { name: roleName },
  });

  const user = await prisma.user.upsert({
    where: { username },
    update: {},
    create: {
      username,
      password: await bcrypt.hash(password, 10),
      name: "Nama Sales Admin",
      role_id: role.id,
    },
  });

  console.log(`Seeded roles: ${ROLES.join(", ")}`);
  console.log(`Seeded user: ${user.username} (role: ${roleName})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
