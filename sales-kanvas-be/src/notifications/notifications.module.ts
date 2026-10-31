import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt'; // ✅ Tambahkan Import JwtModule
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { PrismaModule } from '../prisma/prisma.module';

// Import semua Listener yang sudah kita buat
import { PlanNotificationListener } from './listeners/plan-notification.listener';
import { InvoiceNotificationListener } from './listeners/invoice-notification.listener';
import { BonNotificationListener } from './listeners/bon-notification.listener';
import { LoadingNotificationListener } from './listeners/loading-notification.listener';
import { SettlementNotificationListener } from './listeners/settlement-notification.listener';
import { PaymentNotificationListener } from './listeners/payment-notification.listener';
import { ReturnNotificationListener } from './listeners/return-notification.listener';

@Module({
  imports: [
    PrismaModule,
    // ✅ Daftarkan JwtModule di sini
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService, 
    NotificationsGateway,
    PlanNotificationListener, 
    InvoiceNotificationListener,
    BonNotificationListener,     
    LoadingNotificationListener,
    PaymentNotificationListener, 
    SettlementNotificationListener,
    ReturnNotificationListener  
  ],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}