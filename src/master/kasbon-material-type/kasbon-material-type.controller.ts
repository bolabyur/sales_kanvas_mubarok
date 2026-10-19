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
import {
  CreateKasbonMaterialTypeDto,
  UpdateKasbonMaterialTypeDto,
} from './kasbon-material-type.dto';
import { KasbonMaterialTypeService } from './kasbon-material-type.service';

@Controller('master/kasbon-material-type')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class KasbonMaterialTypeController {
  constructor(
    private readonly kasbonMaterialTypeService: KasbonMaterialTypeService,
  ) {}

  @Get()
  @Authenticated()
  findAll() {
    return this.kasbonMaterialTypeService.findAll();
  }

  @Get(':id')
  @Authenticated()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.kasbonMaterialTypeService.findOne(id);
  }

  @Post()
  @RequirePermission('kasbon-material-type:write')
  create(
    @Body() dto: CreateKasbonMaterialTypeDto,
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ip: string,
  ) {
    return this.kasbonMaterialTypeService.create(dto, user.id, ip);
  }

  @Patch(':id')
  @RequirePermission('kasbon-material-type:write')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateKasbonMaterialTypeDto,
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ip: string,
  ) {
    return this.kasbonMaterialTypeService.update(id, dto, user.id, ip);
  }

  @Delete(':id')
  @RequirePermission('kasbon-material-type:write')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.kasbonMaterialTypeService.remove(id);
  }
}
