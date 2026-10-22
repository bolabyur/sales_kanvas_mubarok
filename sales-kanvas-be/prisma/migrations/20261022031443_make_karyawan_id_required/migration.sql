-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_karyawan_id_fkey";

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "karyawan_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_karyawan_id_fkey" FOREIGN KEY ("karyawan_id") REFERENCES "ms_employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
