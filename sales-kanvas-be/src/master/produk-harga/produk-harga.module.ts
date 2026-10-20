import { Module } from '@nestjs/common';
import { ProdukHargaService } from './produk-harga.service';
import { ProdukHargaController } from './produk-harga.controller';
import { PrismaModule } from '../../prisma/prisma.module';
@Module({ imports: [PrismaModule], controllers: [ProdukHargaController], providers: [ProdukHargaService] })
export class ProdukHargaModule {}