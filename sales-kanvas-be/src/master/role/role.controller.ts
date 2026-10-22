import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RoleService } from './role.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@ApiTags('Master - Role')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('master/role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @RequirePermission('role:write')
  create(@Body() dto: CreateRoleDto) { return this.roleService.create(dto); }

  @Get()
  @RequirePermission('role:read')
  findAll() { return this.roleService.findAll(); }

  @Patch(':id')
  @RequirePermission('role:write')
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) { return this.roleService.update(+id, dto); }

  @Delete(':id')
  @RequirePermission('role:write')
  remove(@Param('id') id: string) { return this.roleService.remove(+id); }
}