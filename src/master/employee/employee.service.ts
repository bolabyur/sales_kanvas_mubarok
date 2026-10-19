import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './employee.dto';

@Injectable()
export class EmployeeService {
  constructor(private readonly prisma: PrismaService) {}

  // List hanya karyawan aktif (untuk dropdown); detail by id tetap bisa semua.
  findAll() {
    return this.prisma.employee.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' },
    });
  }

  findOne(id: number) {
    return this.prisma.employee.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateEmployeeDto, userId: number, ip: string) {
    return this.prisma.employee.create({
      data: { ...dto, user_id: userId, ip },
    });
  }

  update(id: number, dto: UpdateEmployeeDto, userId: number, ip: string) {
    return this.prisma.employee.update({
      where: { id },
      data: { ...dto, user_id: userId, ip, updated_at: new Date() },
    });
  }
}
