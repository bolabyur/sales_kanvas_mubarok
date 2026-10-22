import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@ApiTags('Master - User')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('master/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @RequirePermission('user:write')
  create(@Body() dto: CreateUserDto) { return this.userService.create(dto); }

  @Get()
  @RequirePermission('user:read')
  findAll() { return this.userService.findAll(); }

  @Get(':id')
  @RequirePermission('user:read')
  findOne(@Param('id') id: string) { return this.userService.findOne(+id); }

  @Patch(':id')
  @RequirePermission('user:write')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) { return this.userService.update(+id, dto); }

  @Delete(':id')
  @RequirePermission('user:write')
  remove(@Param('id') id: string) { return this.userService.remove(+id); }
}