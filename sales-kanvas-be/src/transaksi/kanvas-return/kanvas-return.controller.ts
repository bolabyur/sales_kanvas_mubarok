import { Controller, Get, Post, Body, Param, UseGuards, UseInterceptors, Headers } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { KanvasReturnService } from './kanvas-return.service';
import { CreateKanvasReturnDto } from './dto/kanvas-return.dto';
import { ReceiveKanvasReturnDto } from './dto/receive-kanvas-return.dto'; 
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { IdempotencyInterceptor } from 'src/common/interceptors/idempotency.interceptor';

@ApiTags('Transaksi - Retur Kanvas')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('transaksi/kanvas-return')
export class KanvasReturnController {
  constructor(private readonly service: KanvasReturnService) {}

  @Post()
  @RequirePermission('retur:create')
  @UseInterceptors(IdempotencyInterceptor)
  create(
    @Body() dto: CreateKanvasReturnDto, 
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-idempotency-key') key?: string
  ) {
    return this.service.create(dto, user.id, '127.0.0.1', key);
  }

  @Post(':id/receive')
  @RequirePermission('retur:receive') 
  @UseInterceptors(IdempotencyInterceptor)
  receive(
    @Param('id') id: string,
    @Body() dto: ReceiveKanvasReturnDto,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-idempotency-key') key?: string,
  ) {
    return this.service.receive(+id, dto, user.id, '127.0.0.1', key);
  }

  @Get()
  @RequirePermission('retur:read')
  findAll() {
    return this.service.findAll();
  }
}