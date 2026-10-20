import { Module } from '@nestjs/common';
import { KasbonMaterialTypeController } from './kasbon-material-type.controller';
import { KasbonMaterialTypeService } from './kasbon-material-type.service';

@Module({
  controllers: [KasbonMaterialTypeController],
  providers: [KasbonMaterialTypeService],
})
export class KasbonMaterialTypeModule {}
