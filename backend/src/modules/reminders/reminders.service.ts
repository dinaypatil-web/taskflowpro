import { Injectable, NotFoundException } from '@nestjs/common';
// import { InjectQueue } from '@nestjs/bullmq';
// import { Queue } from 'bullmq';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { ReminderQueryDto } from './dto/reminder-query.dto';

@Injectable()
export class RemindersService {
  constructor(
    private prisma: PrismaService,
    // @InjectQueue('reminders') private reminderQueue: Queue,
  ) {}

  async create(userId: string, createReminderDto: CreateReminderDto) {
    const { taskId, ...reminderData } = createReminderDto;

    // Verify task belongs to user
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, userId, isDeleted: false },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const reminder = await this.prisma.reminder.create({
      data: {
        ...reminderData,
        taskId,
      },
      include: {
        task: {
          include: {
            taskStakeholders: {
              include: {
                stakeholder: true,
              },
            },
          },
        },
      },
    });

    // Schedule the reminder job (disabled for development)
    // await this.scheduleReminderJob(reminder);

    return reminder;
  }

  async findAll(userId: string, query: ReminderQueryDto) {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      taskId,
      sortBy = 'scheduledAt',
      sortOrder = 'asc',
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {
      task: {
        userId,
        isDeleted: false,
      },
    };

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (taskId) {
      where.taskId = taskId;
    }

    const [reminders, total] = await Promise.all([
      this.prisma.reminder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          task: {
            select: {
              id: true,
              title: true,
              status: true,
              dueDate: true,
            },
          },
          reminderLogs: {
            orderBy: { createdAt: 'desc' },
            take: 3,
          },
        },
      }),
      this.prisma.reminder.count({ where }),
    ]);

    return {
      reminders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, id: string) {
    const reminder = await this.prisma.reminder.findFirst({
      where: {
        id,
        task: {
          userId,
          isDeleted: false,
        },
      },
      include: {
        task: {
          include: {
            taskStakeholders: {
              include: {
                stakeholder: true,
              },
            },
          },
        },
        reminderLogs: {
          orderBy: { createdAt: 'desc' },
          include: {
            stakeholder: true,
          },
        },
      },
    });

    if (!reminder) {
      throw new NotFoundException('Reminder not found');
    }

    return reminder;
  }

  async update(userId: string, id: string, updateReminderDto: UpdateReminderDto) {
    const existingReminder = await this.prisma.reminder.findFirst({
      where: {
        id,
        task: {
          userId,
          isDeleted: false,
        },
      },
    });

    if (!existingReminder) {
      throw new NotFoundException('Reminder not found');
    }

    const reminder = await this.prisma.reminder.update({
      where: { id },
      data: updateReminderDto,
      include: {
        task: {
          include: {
            taskStakeholders: {
              include: {
                stakeholder: true,
              },
            },
          },
        },
      },
    });

    // Reschedule if scheduledAt changed and status is PENDING (disabled for development)
    // if (updateReminderDto.scheduledAt && reminder.status === 'PENDING') {
    //   await this.scheduleReminderJob(reminder);
    // }

    return reminder;
  }

  async cancel(userId: string, id: string) {
    const reminder = await this.prisma.reminder.findFirst({
      where: {
        id,
        task: {
          userId,
          isDeleted: false,
        },
      },
    });

    if (!reminder) {
      throw new NotFoundException('Reminder not found');
    }

    await this.prisma.reminder.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    // Remove from queue (disabled for development)
    // await this.reminderQueue.removeJobs(`reminder-${id}`);

    return { message: 'Reminder cancelled successfully' };
  }

  async createTaskDueReminder(taskId: string, scheduledAt: Date) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        taskStakeholders: {
          include: {
            stakeholder: true,
          },
        },
      },
    });

    if (!task) return;

    const reminder = await this.prisma.reminder.create({
      data: {
        taskId,
        type: 'TASK_DUE',
        scheduledAt,
        message: `Task "${task.title}" is due soon`,
      },
      include: {
        task: {
          include: {
            taskStakeholders: {
              include: {
                stakeholder: true,
              },
            },
          },
        },
      },
    });

    await this.scheduleReminderJob(reminder);
    return reminder;
  }

  async createOverdueReminder(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        taskStakeholders: {
          include: {
            stakeholder: true,
          },
        },
      },
    });

    if (!task) return;

    const reminder = await this.prisma.reminder.create({
      data: {
        taskId,
        type: 'TASK_OVERDUE',
        scheduledAt: new Date(),
        message: `Task "${task.title}" is overdue`,
      },
      include: {
        task: {
          include: {
            taskStakeholders: {
              include: {
                stakeholder: true,
              },
            },
          },
        },
      },
    });

    await this.scheduleReminderJob(reminder);
    return reminder;
  }

  private async scheduleReminderJob(reminder: any) {
    // Disabled for development - would normally schedule with BullMQ
    console.log('Would schedule reminder job for:', reminder.id);
    return;
    
    /*
    const delay = reminder.scheduledAt.getTime() - Date.now();
    
    if (delay > 0) {
      await this.reminderQueue.add(
        'process-reminder',
        { reminderId: reminder.id },
        {
          delay,
          jobId: `reminder-${reminder.id}`,
          removeOnComplete: 10,
          removeOnFail: 5,
        },
      );
    } else {
      // Schedule immediately if time has passed
      await this.reminderQueue.add(
        'process-reminder',
        { reminderId: reminder.id },
        {
          jobId: `reminder-${reminder.id}`,
          removeOnComplete: 10,
          removeOnFail: 5,
        },
      );
    }
    */
  }

  async getPendingReminders(userId: string) {
    return this.prisma.reminder.findMany({
      where: {
        task: {
          userId,
          isDeleted: false,
        },
        status: 'PENDING',
        scheduledAt: {
          lte: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next 24 hours
        },
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            dueDate: true,
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async getReminderStats(userId: string) {
    const [totalReminders, sentReminders, pendingReminders, failedReminders] = await Promise.all([
      this.prisma.reminder.count({
        where: {
          task: {
            userId,
            isDeleted: false,
          },
        },
      }),
      this.prisma.reminder.count({
        where: {
          task: {
            userId,
            isDeleted: false,
          },
          status: 'SENT',
        },
      }),
      this.prisma.reminder.count({
        where: {
          task: {
            userId,
            isDeleted: false,
          },
          status: 'PENDING',
        },
      }),
      this.prisma.reminder.count({
        where: {
          task: {
            userId,
            isDeleted: false,
          },
          status: 'FAILED',
        },
      }),
    ]);

    return {
      totalReminders,
      sentReminders,
      pendingReminders,
      failedReminders,
      successRate: totalReminders > 0 ? (sentReminders / totalReminders) * 100 : 0,
    };
  }
}