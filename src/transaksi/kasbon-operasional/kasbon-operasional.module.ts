import { Module } from '@nestjs/common';
import { KasbonOperasionalService } from './kasbon-operasional.service';
import { KasbonOperasionalController } from './kasbon-operasional.controller';

@Module({
  controllers: [KasbonOperasionalController],
  providers: [KasbonOperasionalService],
})
export class KasbonOperasionalModule {}
