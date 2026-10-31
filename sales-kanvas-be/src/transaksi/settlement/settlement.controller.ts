import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Query, 
  UseGuards,
  ParseIntPipe
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SettlementService } from './settlement.service';
import { CreateSettlementDto } from './dto/settlement.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

@ApiTags('Transaksi - Settlement')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('transaksi/settlement')
export class SettlementController {
  constructor(private readonly settlementService: SettlementService) {}

  @Post()
  @RequirePermission('settlement:write')
  @ResponseMessage('Settlement berhasil dibuat')
  create(
    @Body() dto: CreateSettlementDto, 
    @CurrentUser() user: AuthenticatedUser 
  ) {
    return this.settlementService.create(dto, user.id); 
  }

  @Get()
  @RequirePermission('settlement:read')
  @ResponseMessage('List Settlement')
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.settlementService.findAll(
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
      search,
    );
  }
}