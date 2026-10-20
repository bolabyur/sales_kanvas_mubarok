import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { OutletService } from './outlet.service';
import { CreateOutletDto, UpdateOutletDto } from './dto/outlet.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'; 
import { PermissionsGuard } from '../../common/guards/permission.guard'; 
import { RequirePermission } from '../../common/decorators/require-permission.decorator'; 
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Master - Outlet')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('master/outlets')
export class OutletController {
  constructor(private readonly outletService: OutletService) {}

  @Post()
  @RequirePermission('outlet:write')
  create(@Body() createOutletDto: CreateOutletDto) {
    return this.outletService.create(createOutletDto);
  }

  @Get()
  @RequirePermission('outlet:read')
  findAll() {
    return this.outletService.findAll();
  }

  @Get(':id')
  @RequirePermission('outlet:read')
  findOne(@Param('id') id: string) {
    return this.outletService.findOne(+id);
  }

  @Patch(':id')
  @RequirePermission('outlet:write')
  update(@Param('id') id: string, @Body() updateOutletDto: UpdateOutletDto) {
    return this.outletService.update(+id, updateOutletDto);
  }

  @Delete(':id')
  @RequirePermission('outlet:write')
  remove(@Param('id') id: string) {
    return this.outletService.remove(+id);
  }
}