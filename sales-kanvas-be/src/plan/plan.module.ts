import { Module } from "@nestjs/common";
import { PlanController } from "./plan.controller";
import { PlanService } from "./plan.service";
import { PrismaModule } from "../prisma/prisma.module";
import { AuditLogModule } from "src/audit-log/audit-log.module";
import { NotificationsModule } from "src/notifications/notifications.module";

@Module({
  imports: [
    PrismaModule, 
    AuditLogModule,
    NotificationsModule
  ],
  controllers: [PlanController],
  providers: [PlanService],
})
export class PlanModule {}