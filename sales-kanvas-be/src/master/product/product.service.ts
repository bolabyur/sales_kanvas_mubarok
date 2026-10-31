import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { AuditLogService } from '../../audit-log/audit-log.service'; 

@Injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  findAll() {
    return this.prisma.product.findMany({
      where: { is_active: true },
      include: {
        produkHargas: true, 
      },
      orderBy: { name: 'asc' },
    });
  }

  findOne(id: number) {
    return this.prisma.product.findUniqueOrThrow({ 
      where: { id },
      include: {
        produkHargas: true,
      }
    });
  }

  async create(dto: CreateProductDto, userId: number, ip: string) {
    const { prices, ...productData } = dto as any; 

    const product = await this.prisma.product.create({
      data: {
        ...productData, 
        user_id: userId, 
        ip,
        produkHargas: prices && prices.length > 0 ? {
          create: prices.map((p: any) => ({
            tipe_harga_id: p.tipe_harga_id,
            harga: p.harga
          }))
        } : undefined
      },
      include: { produkHargas: true }
    });

    await this.auditLog.log({
      user_id: userId,
      action: 'CREATE_PRODUCT',
      entity: 'Product',
      entity_id: product.id,
      new_values: { name: product.name, code: product.code, hpp: product.hpp },
    });

    return product;
  }

  async update(id: number, dto: UpdateProductDto, userId: number, ip: string) {
    const { prices, ...productData } = dto as any;
    const oldProduct = await this.prisma.product.findUniqueOrThrow({ where: { id } });

    return this.prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id },
        data: { ...productData, user_id: userId, ip, updated_at: new Date() },
      });

      if (prices && prices.length > 0) {
        for (const p of prices) {
          await tx.produkHarga.upsert({
            where: { produk_id_tipe_harga_id: { produk_id: id, tipe_harga_id: p.tipe_harga_id } },
            update: { harga: p.harga },
            create: { produk_id: id, tipe_harga_id: p.tipe_harga_id, harga: p.harga }
          });
        }
      }

      await this.auditLog.log({
        user_id: userId,
        action: 'UPDATE_PRODUCT',
        entity: 'Product',
        entity_id: id,
        old_values: { name: oldProduct.name, hpp: oldProduct.hpp },
        new_values: { name: updatedProduct.name, hpp: updatedProduct.hpp },
      });

      return tx.product.findUnique({
        where: { id },
        include: { produkHargas: true }
      });
    });
  }

  async remove(id: number) {
    const product = await this.prisma.product.delete({ where: { id } });
    
    await this.auditLog.log({
      user_id: product.user_id, 
      action: 'DELETE_PRODUCT',
      entity: 'Product',
      entity_id: id,
      old_values: { name: product.name, code: product.code },
    });

    return product;
  }
}