import {
  Body,
  Controller,
  Delete,
  Get,
  Ip,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { Authenticated } from '../../common/decorators/authenticated.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateMarketAreaDto, UpdateMarketAreaDto } from './market-area.dto';
import { MarketAreaService } from './market-area.service';

@Controller('master/market-area')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MarketAreaController {
  constructor(private readonly marketAreaService: MarketAreaService) {}

  @Get()
  @Authenticated()
  findAll() {
    return this.marketAreaService.findAll();
  }

  @Get(':id')
  @Authenticated()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.marketAreaService.findOne(id);
  }

  @Post()
  @RequirePermission('market-area:write')
  create(
    @Body() dto: CreateMarketAreaDto,
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ip: string,
  ) {
    return this.marketAreaService.create(dto, user.id, ip);
  }

  @Patch(':id')
  @RequirePermission('market-area:write')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMarketAreaDto,
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ip: string,
  ) {
    return this.marketAreaService.update(id, dto, user.id, ip);
  }

  @Delete(':id')
  @RequirePermission('market-area:write')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.marketAreaService.remove(id);
  }
}
