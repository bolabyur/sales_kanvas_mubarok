import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  Req,
  Patch,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { Request } from "express";

import { InvoiceService } from "./invoice.service";
import { CreateInvoiceDto } from "./dto/invoice.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permission.guard";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { AuthenticatedUser } from "../../common/interfaces/authenticated-user.interface";
import { IdempotencyInterceptor } from "src/common/interceptors/idempotency.interceptor";

@ApiTags("Transaksi - Invoice")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("transaksi/invoice")
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @RequirePermission("invoice:create")
  @UseInterceptors(IdempotencyInterceptor)
  create(
    @Body() dto: CreateInvoiceDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.invoiceService.create(dto, user);
  }

  @Get()
  @RequirePermission("invoice:read")
  findAll() {
    return this.invoiceService.findAll();
  }

  @Get(":id")
  @RequirePermission("invoice:read")
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.invoiceService.findOne(id, user);
  }
  
  @Patch(':id/cancel')
  @RequirePermission('invoice:update') 
  cancel(@Param('id') id: string, @Req() req: any) {
    return this.invoiceService.cancel(+id, req.user);
  }
}