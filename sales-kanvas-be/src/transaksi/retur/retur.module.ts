import { Module } from '@nestjs/common';
import { ReturService } from './retur.service';
import { ReturController } from './retur.controller';
import { PrismaModule } from '../../prisma/prisma.module';
@Module({ imports: [PrismaModule], controllers: [ReturController], providers: [ReturService] })
export class ReturModule {}