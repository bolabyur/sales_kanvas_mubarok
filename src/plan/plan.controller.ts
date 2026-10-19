import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PlanService } from './plan.service';
import { CreatePlanDto, UpdatePlanDto, UpdateStatusPlanDto, FindAllPlanDto } from './dto/plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

@ApiTags('Perencanaan - Plan')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('plan')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Post()
  @RequirePermission('plan:write')
  @ResponseMessage('Plan created successfully')
  create(
    @Body() dto: CreatePlanDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // Karena ip.decorator hilang, kita hardcode dulu ip-nya atau sesuaikan di service
    return this.planService.create(dto, user.id, '127.0.0.1'); 
  }

  @Get()
  @RequirePermission('plan:read')
  @ResponseMessage('List Plan')
  findAll(@Query() query: FindAllPlanDto) {
    return this.planService.findAll(query);
  }

  @Get(':id')
  @RequirePermission('plan:read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.planService.findOne(id);
  }

  @Patch(':id/update-status')
  @RequirePermission('plan:write')
  @ResponseMessage('Plan status updated')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusPlanDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.planService.updateStatus(id, dto, user.id, '127.0.0.1');
  }

  @Patch(':id')
  @RequirePermission('plan:write')
  @ResponseMessage('Plan updated')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePlanDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.planService.update(id, dto, user.id, '127.0.0.1');
  }
}