import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { VoiceTaskDto } from './dto/voice-task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createTaskDto: CreateTaskDto) {
    const { stakeholderIds, ...taskData } = createTaskDto;

    const task = await this.prisma.task.create({
      data: {
        ...taskData,
        userId,
        taskStakeholders: stakeholderIds?.length ? {
          create: stakeholderIds.map(stakeholderId => ({
            stakeholderId,
            role: 'assignee',
          })),
        } : undefined,
      },
      include: {
        taskStakeholders: {
          include: {
            stakeholder: true,
          },
        },
      },
    });

    return task;
  }

  async createFromVoice(userId: string, voiceTaskDto: VoiceTaskDto) {
    const { stakeholderIds, voiceMetadata, ...taskData } = voiceTaskDto;

    const task = await this.prisma.task.create({
      data: {
        ...taskData,
        userId,
        isVoiceCreated: true,
        voiceMetadata: voiceMetadata ? JSON.stringify(voiceMetadata) : null,
        taskStakeholders: stakeholderIds?.length ? {
          create: stakeholderIds.map(stakeholderId => ({
            stakeholderId,
            role: 'assignee',
          })),
        } : undefined,
      },
      include: {
        taskStakeholders: {
          include: {
            stakeholder: true,
          },
        },
      },
    });

    return task;
  }

  async findAll(userId: string, query: TaskQueryDto) {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      dueDateFrom,
      dueDateTo,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      isDeleted: false,
    };

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (dueDateFrom || dueDateTo) {
      where.dueDate = {};
      if (dueDateFrom) {
        where.dueDate.gte = new Date(dueDateFrom);
      }
      if (dueDateTo) {
        where.dueDate.lte = new Date(dueDateTo);
      }
    }

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          taskStakeholders: {
            include: {
              stakeholder: true,
            },
          },
          reminders: {
            where: { status: 'PENDING' },
            orderBy: { scheduledAt: 'asc' },
            take: 3,
          },
        },
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, id: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id,
        userId,
        isDeleted: false,
      },
      include: {
        taskStakeholders: {
          include: {
            stakeholder: true,
          },
        },
        reminders: {
          orderBy: { scheduledAt: 'asc' },
        },
        calendarEvents: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(userId: string, id: string, updateTaskDto: UpdateTaskDto) {
    const { stakeholderIds, ...taskData } = updateTaskDto;

    // Check if task exists and belongs to user
    const existingTask = await this.prisma.task.findFirst({
      where: { id, userId, isDeleted: false },
    });

    if (!existingTask) {
      throw new NotFoundException('Task not found');
    }

    // Update task with stakeholders
    const task = await this.prisma.$transaction(async (tx) => {
      // Update task data
      const updatedTask = await tx.task.update({
        where: { id },
        data: {
          ...taskData,
          completedAt: taskData.status === 'COMPLETED' ? new Date() : null,
        },
      });

      // Update stakeholders if provided
      if (stakeholderIds !== undefined) {
        // Remove existing stakeholders
        await tx.taskStakeholder.deleteMany({
          where: { taskId: id },
        });

        // Add new stakeholders
        if (stakeholderIds.length > 0) {
          await tx.taskStakeholder.createMany({
            data: stakeholderIds.map(stakeholderId => ({
              taskId: id,
              stakeholderId,
              role: 'assignee',
            })),
          });
        }
      }

      return updatedTask;
    });

    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, userId, isDeleted: false },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.prisma.task.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return { message: 'Task deleted successfully' };
  }

  async getTasksByStatus(userId: string) {
    const tasks = await this.prisma.task.groupBy({
      by: ['status'],
      where: {
        userId,
        isDeleted: false,
      },
      _count: {
        id: true,
      },
    });

    return tasks.reduce((acc, task) => {
      acc[task.status] = task._count.id;
      return acc;
    }, {} as Record<string, number>);
  }

  async getOverdueTasks(userId: string) {
    const now = new Date();
    
    const overdueTasks = await this.prisma.task.findMany({
      where: {
        userId,
        isDeleted: false,
        status: { not: 'COMPLETED' },
        dueDate: { lt: now },
      },
      include: {
        taskStakeholders: {
          include: {
            stakeholder: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Update overdue tasks status
    if (overdueTasks.length > 0) {
      await this.prisma.task.updateMany({
        where: {
          id: { in: overdueTasks.map(t => t.id) },
          status: { not: 'OVERDUE' },
        },
        data: { status: 'OVERDUE' },
      });
    }

    return overdueTasks;
  }

  async getUpcomingTasks(userId: string, days: number = 7) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    return this.prisma.task.findMany({
      where: {
        userId,
        isDeleted: false,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
        dueDate: {
          gte: now,
          lte: futureDate,
        },
      },
      include: {
        taskStakeholders: {
          include: {
            stakeholder: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }
}