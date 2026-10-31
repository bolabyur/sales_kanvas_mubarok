import { Module } from '@nestjs/common';
import { KasbonProdukService } from './kasbon-produk.service';
import { KasbonProdukController } from './kasbon-produk.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../../notifications/notifications.module'; 

@Module({
  imports: [
    PrismaModule,
    NotificationsModule, 
  ],
  controllers: [KasbonProdukController],
  providers: [KasbonProdukService],
})
export class KasbonProdukModule {}