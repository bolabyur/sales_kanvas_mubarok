import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'; // Tambahkan ini
import { BatchService } from './batch.service';
import { CreateBatchDto, UpdateBatchDto } from './dto/batch.dto'; // Cukup import class-nya
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@ApiTags('Master - Batch') // Agar rapi di Swagger
@ApiBearerAuth('access-token') // Ikon gembok
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('master/batch')
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

  @Post()
  @RequirePermission('batch:write')
  create(@Body() createBatchDto: CreateBatchDto) {
    return this.batchService.create(createBatchDto);
  }

  @Get()
  @RequirePermission('batch:read')
  findAll() {
    return this.batchService.findAll();
  }

  @Get(':id')
  @RequirePermission('batch:read')
  findOne(@Param('id') id: string) {
    return this.batchService.findOne(+id);
  }

  @Patch(':id')
  @RequirePermission('batch:write')
  update(@Param('id') id: string, @Body() updateBatchDto: UpdateBatchDto) {
    return this.batchService.update(+id, updateBatchDto);
  }

  @Delete(':id')
  @RequirePermission('batch:write')
  remove(@Param('id') id: string) {
    return this.batchService.remove(+id);
  }
}