import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export type FefoAllocation = {
  batch_id: number;
  qty: number;
  no_batch: string;
  expired_date: Date;
};

/**
 * Alokasi stok FEFO (First Expired, First Out).
 * - Hanya memakai batch dengan stok > 0 dan ED >= hari ini.
 * - Boleh split ke beberapa batch jika batch pertama tidak cukup.
 * - Throw BadRequestException jika total stok tidak cukup.
 */
export async function allocateFefo(
  tx: Prisma.TransactionClient,
  produk_id: number,
  qty: number,
  today: Date = new Date(),
): Promise<FefoAllocation[]> {
  if (qty <= 0) {
    throw new BadRequestException('Qty harus lebih dari 0.');
  }

  const startOfToday = new Date(today);
  startOfToday.setHours(0, 0, 0, 0);

  const batches = await tx.batch.findMany({
    where: {
      produk_id,
      is_deleted: false,
      stok_gudang: { gt: 0 },
      expired_date: { gte: startOfToday },
    },
    orderBy: { expired_date: 'asc' },
  });

  let remaining = qty;
  const allocations: FefoAllocation[] = [];

  for (const batch of batches) {
    if (remaining <= 0) break;
    const take = Math.min(batch.stok_gudang, remaining);
    if (take > 0) {
      allocations.push({
        batch_id: batch.id,
        qty: take,
        no_batch: batch.no_batch,
        expired_date: batch.expired_date,
      });
      remaining -= take;
    }
  }

  if (remaining > 0) {
    throw new BadRequestException(
      `Stok tidak cukup untuk produk ID ${produk_id}. Kurang ${remaining} unit (setelah filter ED aktif).`,
    );
  }

  return allocations;
}