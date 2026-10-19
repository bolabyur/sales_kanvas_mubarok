import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PlanModule } from './plan/plan.module';
import { VehicleModule } from './master/vehicle/vehicle.module';
import { MarketAreaModule } from './master/market-area/market-area.module';
import { ProductModule } from './master/product/product.module';
import { EmployeeModule } from './master/employee/employee.module';
import { KasbonMaterialTypeModule } from './master/kasbon-material-type/kasbon-material-type.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    PlanModule,
    VehicleModule,
    MarketAreaModule,
    ProductModule,
    EmployeeModule,
    KasbonMaterialTypeModule,
  ],
  providers: [{ provide: APP_INTERCEPTOR, useClass: ResponseInterceptor }],
})
export class AppModule {}
