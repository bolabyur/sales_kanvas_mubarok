-- AlterTable
ALTER TABLE "user" ADD COLUMN     "karyawan_id" INTEGER;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_karyawan_id_fkey" FOREIGN KEY ("karyawan_id") REFERENCES "ms_employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
