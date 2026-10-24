import { Module } from "@nestjs/common";
import { PlanController } from "./plan.controller";
import { PlanService } from "./plan.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({ 
    controllers: [PlanController], 
    providers: [PlanService],
    imports: [PrismaModule],
 })
export class PlanModule {}
