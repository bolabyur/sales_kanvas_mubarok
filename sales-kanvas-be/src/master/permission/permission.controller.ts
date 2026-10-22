import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@ApiTags('Master - Permission')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('master/permission')
export class PermissionController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @RequirePermission('permission:read')
  async findAll() {
    return this.prisma.permission.findMany({ orderBy: { name: 'asc' } });
  }
}