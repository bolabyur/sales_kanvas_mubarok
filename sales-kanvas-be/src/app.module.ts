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
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { OutletModule } from './master/outlet/outlet.module';
import { BatchModule } from './master/batch/batch.module';
import { TipeHargaModule } from './master/tipe-harga/tipe-harga.module';
import { InvoiceModule } from './transaksi/invoice/invoice.module';
import { KasbonProdukModule } from './transaksi/kasbon-produk/kasbon-produk.module';
import { ProdukOutModule } from './transaksi/produk-out/produk-out.module';
import { KasbonOperasionalModule } from './transaksi/kasbon-operasional/kasbon-operasional.module';
import { ProdukInModule } from './transaksi/produk-in/produk-in.module';
import { SettlementModule } from './transaksi/settlement/settlement.module';
import { GudangModule } from './master/gudang/gudang.module';
import { PlanOutletModule } from './transaksi/plan-outlet/plan-outlet.module';
import { ReturModule } from './transaksi/retur/retur.module';
import { PembayaranModule } from './transaksi/pembayaran/pembayaran.module';
import { UserModule } from './master/user/user.module';
import { RoleModule } from './master/role/role.module';
import { PermissionModule } from './master/permission/permission.module';
import { KanvasReturnModule } from './transaksi/kanvas-return/kanvas-return.module';
import { ProdukDestructionModule } from './transaksi/produk-destruction/produk-destruction.module';
import { SummaryModule } from './summary/summary.module';



@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    OutletModule,
    TipeHargaModule,
    BatchModule,
    AuthModule,
    PlanModule,
    VehicleModule,
    MarketAreaModule,
    ProductModule,
    EmployeeModule,
    InvoiceModule,
    KasbonProdukModule,
    ProdukOutModule,
    KasbonOperasionalModule,
    ProdukInModule,
    SettlementModule,
    GudangModule,
    PlanOutletModule,
    ReturModule,
    PembayaranModule,
    UserModule,
    RoleModule,
    PermissionModule,
    KanvasReturnModule,
    ProdukDestructionModule,
    SummaryModule,
  ],
  providers: [{ provide: APP_INTERCEPTOR, useClass: ResponseInterceptor }],
})
export class AppModule {}
