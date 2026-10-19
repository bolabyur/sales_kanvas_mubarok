import {
  Body,
  Controller,
  Get,
  Ip,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PermissionsGuard } from '../common/guards/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import {
  CreatePlanDto,
  FindAllPlanDto,
  UpdatePlanDto,
  UpdateStatusPlanDto,
} from './plan.dto';
import { PlanService } from './plan.service';

@Controller('plan')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Post()
  @RequirePermission('plan:write')
  @ResponseMessage('Plan created successfully')
  create(
    @Body() dto: CreatePlanDto,
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ip: string,
  ) {
    return this.planService.create(dto, user.id, ip);
  }

  @Get()
  @RequirePermission('plan:read')
  @ResponseMessage('List Plan')
  findAll(@Query() query: FindAllPlanDto) {
    return this.planService.findAll(query);
  }

  @Get(':id')
  @RequirePermission('plan:read')
  @ResponseMessage('Plan found')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.planService.findOne(id);
  }

  @Patch(':id/update-status')
  @RequirePermission('plan:write')
  @ResponseMessage('Plan status updated successfully')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusPlanDto,
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ip: string,
  ) {
    return this.planService.updateStatus(id, dto, user.id, ip);
  }

  // PATCH :id = REVISI: plan lama dibatalkan, dibuat plan baru (revision+1).
  @Patch(':id')
  @RequirePermission('plan:write')
  @ResponseMessage('Plan revised successfully')
  revise(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePlanDto,
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ip: string,
  ) {
    return this.planService.revise(id, dto, user.id, ip);
  }
}
