import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const DetailKasbonSchema = z.object({
  produk_id: z.number().int().positive(),
  qty_bawa: z.number().int().positive(),
});

const OperasionalSchema = z.object({
  nama_pengeluaran: z.string().min(1),
  nominal: z.number().positive(),
  foto_bukti: z.string().optional().default('default.jpg'),
});

const CreateKasbonProdukSchema = z.object({
  sales_kanvas_plan_id: z.number().int().positive(),
  details: z.array(DetailKasbonSchema).min(1, 'Minimal harus ada 1 barang yang diminta'),
  
  operasional: z.array(OperasionalSchema).optional().default([]), 
});

export class CreateKasbonProdukDto extends createZodDto(CreateKasbonProdukSchema) {}