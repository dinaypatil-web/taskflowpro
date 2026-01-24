import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateStakeholderDto } from './dto/create-stakeholder.dto';
import { UpdateStakeholderDto } from './dto/update-stakeholder.dto';
import { StakeholderQueryDto } from './dto/stakeholder-query.dto';

@Injectable()
export class StakeholdersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createStakeholderDto: CreateStakeholderDto) {
    const { tags, ...stakeholderData } = createStakeholderDto;
    
    const stakeholder = await this.prisma.stakeholder.create({
      data: {
        ...stakeholderData,
        userId,
        tags: tags ? JSON.stringify(tags) : null,
      },
    });

    return stakeholder;
  }

  async findAll(userId: string, query: StakeholderQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      organization,
      tags,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    if (organization) {
      where.organization = { contains: organization };
    }

    if (tags && tags.length > 0) {
      // For SQLite, we'll need to search in the JSON string
      where.tags = { contains: tags[0] }; // Simplified for demo
    }

    const [stakeholders, total] = await Promise.all([
      this.prisma.stakeholder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          taskStakeholders: {
            include: {
              task: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                  dueDate: true,
                },
              },
            },
          },
          _count: {
            select: {
              taskStakeholders: true,
            },
          },
        },
      }),
      this.prisma.stakeholder.count({ where }),
    ]);

    return {
      stakeholders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, id: string) {
    const stakeholder = await this.prisma.stakeholder.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      include: {
        taskStakeholders: {
          include: {
            task: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                dueDate: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            task: {
              createdAt: 'desc',
            },
          },
        },
        reminderLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!stakeholder) {
      throw new NotFoundException('Stakeholder not found');
    }

    return stakeholder;
  }

  async update(userId: string, id: string, updateStakeholderDto: UpdateStakeholderDto) {
    const existingStakeholder = await this.prisma.stakeholder.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!existingStakeholder) {
      throw new NotFoundException('Stakeholder not found');
    }

    const { tags, ...updateData } = updateStakeholderDto;
    
    const stakeholder = await this.prisma.stakeholder.update({
      where: { id },
      data: {
        ...updateData,
        tags: tags ? JSON.stringify(tags) : undefined,
      },
    });

    return stakeholder;
  }

  async remove(userId: string, id: string) {
    const stakeholder = await this.prisma.stakeholder.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!stakeholder) {
      throw new NotFoundException('Stakeholder not found');
    }

    await this.prisma.stakeholder.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    return { message: 'Stakeholder deleted successfully' };
  }

  async getStakeholderStats(userId: string, stakeholderId: string) {
    const [totalTasks, completedTasks, pendingTasks, overdueTasks] = await Promise.all([
      this.prisma.taskStakeholder.count({
        where: {
          stakeholderId,
          task: {
            userId,
            isDeleted: false,
          },
        },
      }),
      this.prisma.taskStakeholder.count({
        where: {
          stakeholderId,
          task: {
            userId,
            status: 'COMPLETED',
            isDeleted: false,
          },
        },
      }),
      this.prisma.taskStakeholder.count({
        where: {
          stakeholderId,
          task: {
            userId,
            status: 'PENDING',
            isDeleted: false,
          },
        },
      }),
      this.prisma.taskStakeholder.count({
        where: {
          stakeholderId,
          task: {
            userId,
            status: 'OVERDUE',
            isDeleted: false,
          },
        },
      }),
    ]);

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    };
  }

  async searchByContact(userId: string, contact: string) {
    return this.prisma.stakeholder.findMany({
      where: {
        userId,
        deletedAt: null,
        OR: [
          { email: { contains: contact } },
          { phone: { contains: contact } },
        ],
      },
      take: 10,
    });
  }

  async getAllTags(userId: string) {
    const stakeholders = await this.prisma.stakeholder.findMany({
      where: {
        userId,
        deletedAt: null,
        tags: { not: null },
      },
      select: { tags: true },
    });

    const allTags = stakeholders
      .map(s => s.tags ? JSON.parse(s.tags) : [])
      .flat();
    const uniqueTags = [...new Set(allTags)];
    
    return uniqueTags.sort();
  }

  async getOrganizations(userId: string) {
    const organizations = await this.prisma.stakeholder.findMany({
      where: {
        userId,
        deletedAt: null,
        organization: { not: null },
      },
      select: { organization: true },
      distinct: ['organization'],
    });

    return organizations
      .map(o => o.organization)
      .filter(Boolean)
      .sort();
  }
}