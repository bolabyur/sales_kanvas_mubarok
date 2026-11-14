import { Global, Module } from '@nestjs/common';
import { CodeGeneratorService } from './code-generator.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [CodeGeneratorService],
  exports: [CodeGeneratorService],
})
export class CodeGeneratorModule {}