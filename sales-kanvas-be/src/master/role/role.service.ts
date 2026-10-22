import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';

@Injectable()
export class RoleService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateRoleDto) {
    try {
      return await this.prisma.role.create({
        data: {
          name: data.name,
          permissionRoles: {
            create: data.permissionIds?.map(id => ({ permission_id: id })) || [],
          },
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') throw new BadRequestException('Nama Role sudah digunakan.');
      throw new BadRequestException('Gagal membuat role.');
    }
  }

  async findAll() {
    return this.prisma.role.findMany({
      include: { permissionRoles: { include: { permission: true } } },
      orderBy: { name: 'asc' }
    });
  }

  async update(id: number, data: UpdateRoleDto) {
    return this.prisma.$transaction(async (tx) => {
      await tx.role.update({ where: { id }, data: { name: data.name } });
      if (data.permissionIds) {
        await tx.permissionRole.deleteMany({ where: { role_id: id } });
        await tx.permissionRole.createMany({
          data: data.permissionIds.map(pid => ({ role_id: id, permission_id: pid })),
        });
      }
      return { success: true };
    });
  }

  async remove(id: number) {
    try {
      return await this.prisma.role.delete({ where: { id } });
    } catch (error: any) {
      if (error.code === 'P2003' || (error.message && error.message.includes('violates foreign key constraint'))) {
        throw new BadRequestException('Role ini tidak bisa dihapus karena masih digunakan oleh User.');
      }
      throw new BadRequestException('Gagal menghapus role. Silakan coba lagi.');
    }
  }
}