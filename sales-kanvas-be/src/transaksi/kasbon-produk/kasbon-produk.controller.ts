import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  UseGuards, 
  Patch, 
  Param, 
  ParseIntPipe 
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { KasbonProdukService } from './kasbon-produk.service';
import { CreateKasbonProdukDto } from './dto/kasbon-produk.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator'; 
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface'; 

@ApiTags('Transaksi - BON Barang')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('transaksi/kasbon-produk')
export class KasbonProdukController {
  constructor(private readonly kasbonProdukService: KasbonProdukService) {}

  @Post()
  @RequirePermission('kasbon-produk:create')
  create(
    @Body() dto: CreateKasbonProdukDto,
    @CurrentUser() user: AuthenticatedUser, 
  ) {
    return this.kasbonProdukService.create(dto, user.id, '127.0.0.1'); 
  }

  @Get()
  @RequirePermission('kasbon-produk:read')
  findAll() {
    return this.kasbonProdukService.findAll();
  }

  @Patch(':id/update-status')
  @RequirePermission('kasbon-produk:update')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { status: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.kasbonProdukService.updateStatus(id, dto.status, user.id, '127.0.0.1');
  }
}