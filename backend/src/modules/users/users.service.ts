import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateProfile(userId: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async deactivateAccount(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    return { message: 'Account deactivated successfully' };
  }

  async getUserStats(userId: string) {
    const [totalTasks, completedTasks, pendingTasks, totalStakeholders] = await Promise.all([
      this.prisma.task.count({
        where: { userId, isDeleted: false },
      }),
      this.prisma.task.count({
        where: { userId, status: 'COMPLETED', isDeleted: false },
      }),
      this.prisma.task.count({
        where: { userId, status: 'PENDING', isDeleted: false },
      }),
      this.prisma.stakeholder.count({
        where: { userId, deletedAt: null },
      }),
    ]);

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      totalStakeholders,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    };
  }
}