import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CodeGeneratorService {
  private readonly logger = new Logger(CodeGeneratorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Menghasilkan nomor dokumen otomatis: PREFIX-YYMMDD-NNN
   * @param tx Prisma Transaction Client (wajib agar masuk ke dalam transaksi bisnis)
   * @param prefix Prefix dokumen (misal: 'INV', 'BON')
   * @param documentDate Tanggal dokumen (WAJIB di-set SEKALI di luar retry loop)
   */
  async generate(
    tx: Prisma.TransactionClient,
    prefix: string,
    documentDate: Date,
  ): Promise<string> {
    const dateKey = this.getDateKeyJakarta(documentDate);

    const result = await tx.$queryRaw<{ last_number: number }[]>`
      INSERT INTO document_sequence (prefix, date_key, last_number)
      VALUES (${prefix}, ${dateKey}, 1)
      ON CONFLICT (prefix, date_key)
      DO UPDATE SET last_number = document_sequence.last_number + 1
      RETURNING last_number;
    `;

    if (!result || result.length === 0 || typeof result[0]?.last_number !== 'number') {
      this.logger.error(
        `[CodeGenerator] Query returned invalid result for ${prefix}-${dateKey}`,
        JSON.stringify(result),
      );
      throw new Error(
        `CodeGenerator: gagal menghasilkan nomor untuk prefix=${prefix} dateKey=${dateKey}`,
      );
    }

    const lastNumber = result[0].last_number;
    const sequenceStr = lastNumber.toString().padStart(3, '0');
    return `${prefix}-${dateKey}-${sequenceStr}`;
  }

  private getDateKeyJakarta(date: Date): string {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const formatted = formatter.format(date);
    const [year, month, day] = formatted.split('-');

    return `${year.slice(2)}${month}${day}`;
  }
}