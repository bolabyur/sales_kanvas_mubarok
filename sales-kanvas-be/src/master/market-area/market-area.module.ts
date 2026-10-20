import { Module } from '@nestjs/common';
import { MarketAreaController } from './market-area.controller';
import { MarketAreaService } from './market-area.service';

@Module({ controllers: [MarketAreaController], providers: [MarketAreaService] })
export class MarketAreaModule {}
