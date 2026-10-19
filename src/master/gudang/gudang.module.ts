import { Module } from '@nestjs/common';
import { GudangService } from './gudang.service';
import { GudangController } from './gudang.controller';
import { PrismaModule } from '../../prisma/prisma.module';
@Module({ imports: [PrismaModule], controllers: [GudangController], providers: [GudangService] })
export class GudangModule {}