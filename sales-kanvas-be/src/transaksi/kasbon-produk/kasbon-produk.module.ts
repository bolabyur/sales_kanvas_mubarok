import { Module } from '@nestjs/common';
import { KasbonProdukService } from './kasbon-produk.service';
import { KasbonProdukController } from './kasbon-produk.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../../notifications/notifications.module'; 
import { CodeGeneratorModule } from 'src/common/services/code-generator.module';

@Module({
  imports: [
    PrismaModule,
    CodeGeneratorModule,
    NotificationsModule, 
  ],
  controllers: [KasbonProdukController],
  providers: [KasbonProdukService],
})
export class KasbonProdukModule {}