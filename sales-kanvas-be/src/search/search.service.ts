import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(q: string) {
    if (!q || q.length < 2) return { plans: [], bons: [], invoices: [] };

    const [plans, bons, invoices] = await Promise.all([
      this.prisma.salesKanvasPlan.findMany({
        where: { invoice: { contains: q, mode: 'insensitive' } },
        select: { id: true, invoice: true, status: true },
        take: 5,
        orderBy: { id: 'desc' },
      }),
      this.prisma.kasbonProduk.findMany({
        where: { salesKanvasPlan: { invoice: { contains: q, mode: 'insensitive' } } },
        select: { id: true, status: true, salesKanvasPlan: { select: { invoice: true } } },
        take: 5,
        orderBy: { id: 'desc' },
      }),
      this.prisma.invoiceOutlet.findMany({
        where: { outlet: { nama_toko: { contains: q, mode: 'insensitive' } } },
        select: { id: true, total_tagihan: true, outlet: { select: { nama_toko: true } } },
        take: 5,
        orderBy: { id: 'desc' },
      }),
    ]);

    return { plans, bons, invoices };
  }
}