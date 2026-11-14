import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { CodeGeneratorModule } from 'src/common/services/code-generator.module';

@Module({
  imports: [PrismaModule, CodeGeneratorModule],
  controllers: [InvoiceController],
  providers: [InvoiceService],
})
export class InvoiceModule {}