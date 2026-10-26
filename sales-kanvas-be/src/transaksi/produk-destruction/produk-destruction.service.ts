import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDestructionDto } from './dto/produk-destruction.dto';

@Injectable()
export class ProdukDestructionService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateDestructionDto, userId: number, ip: string) {
    return this.prisma.$transaction(async (tx) => {
      const gudang = await tx.gudang.findUnique({ where: { id: data.gudang_id } });
      if (!gudang) throw new NotFoundException('Gudang tidak ditemukan');

      const destruction = await tx.produkDestruction.create({
        data: {
          gudang_id: data.gudang_id,
          tgl_destruction: new Date(data.tgl_destruction),
          alasan: data.alasan,
          status: 'DONE',
          user_id: userId,
          ip: ip,
        },
      });

      for (const item of data.details) {
        const batch = await tx.batch.findUnique({ where: { id: item.batch_id } });
        if (!batch) throw new BadRequestException(`Batch ID ${item.batch_id} tidak ditemukan`);

        await tx.produkDestructionDetail.create({
          data: {
            produk_destruction_id: destruction.id,
            batch_id: item.batch_id,
            produk_id: item.produk_id,
            qty_dimusnahkan: item.qty_dimusnahkan,
          },
        });

        await tx.mutasiBatch.create({
          data: {
            batch_id: item.batch_id,
            tipe_mutasi: 'OUT',
            qty: item.qty_dimusnahkan,
            keterangan: `DESTRUCTION (Pemusnahan) - ${data.alasan}`,
          },
        });
      }

      return destruction;
    });
  }

  async findAll() {
    return this.prisma.produkDestruction.findMany({
      where: { is_deleted: false },
      include: {
        gudang: true,
        details: { include: { produk: true, batch: true } },
      },
      orderBy: { id: 'desc' },
    });
  }
}