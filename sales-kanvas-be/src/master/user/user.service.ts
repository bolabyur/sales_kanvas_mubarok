import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUserDto) {
    try {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      return await this.prisma.user.create({
        data: { 
          ...data, 
          password: hashedPassword 
        },
        include: { role: true, karyawan: true } 
      });
    } catch (error: any) {
      if (error.code === 'P2002') throw new BadRequestException('Username sudah digunakan.');
      if (error.code === 'P2003') throw new BadRequestException('ID Karyawan atau Role tidak ditemukan di database.');
      throw new BadRequestException(error.message);
    }
  }

  async findAll() {
    return this.prisma.user.findMany({
      include: { role: true, karyawan: true },
      orderBy: { name: 'asc' }
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true, karyawan: true }
    });
    if (!user) throw new NotFoundException('User tidak ditemukan');
    return user;
  }

  async update(id: number, data: UpdateUserDto) {
    try {
      await this.findOne(id); 
      const updateData: any = { ...data };
      if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 10);
      }
      return await this.prisma.user.update({
        where: { id },
        data: updateData,
        include: { role: true, karyawan: true }
      });
    } catch (error: any) {
      if (error.code === 'P2002') throw new BadRequestException('Username sudah digunakan.');
      if (error.code === 'P2003') throw new BadRequestException('ID Karyawan atau Role tidak ditemukan.');
      throw new BadRequestException(error.message);
    }
  }

  async remove(id: number) {
    try {
      await this.findOne(id);
      return await this.prisma.user.delete({ where: { id } });
    } catch (error: any) {
      throw new BadRequestException('Gagal menghapus user, pastikan user tidak memiliki relasi aktif.');
    }
  }
}