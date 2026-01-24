import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';
import { CalendarQueryDto } from './dto/calendar-query.dto';

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  async createEvent(userId: string, createEventDto: CreateCalendarEventDto) {
    const event = await this.prisma.calendarEvent.create({
      data: {
        ...createEventDto,
        userId,
        startDate: new Date(createEventDto.startDate),
        endDate: new Date(createEventDto.endDate),
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    return event;
  }

  async findEvents(userId: string, query: CalendarQueryDto) {
    const { startDate, endDate, taskId } = query;

    const where: any = {
      userId,
    };

    if (startDate && endDate) {
      where.OR = [
        {
          startDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        {
          endDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        {
          AND: [
            { startDate: { lte: new Date(startDate) } },
            { endDate: { gte: new Date(endDate) } },
          ],
        },
      ];
    }

    if (taskId) {
      where.taskId = taskId;
    }

    const events = await this.prisma.calendarEvent.findMany({
      where,
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    return events;
  }

  async findOne(userId: string, id: string) {
    const event = await this.prisma.calendarEvent.findFirst({
      where: { id, userId },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            dueDate: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Calendar event not found');
    }

    return event;
  }

  async update(userId: string, id: string, updateEventDto: UpdateCalendarEventDto) {
    const existingEvent = await this.prisma.calendarEvent.findFirst({
      where: { id, userId },
    });

    if (!existingEvent) {
      throw new NotFoundException('Calendar event not found');
    }

    const updateData: any = { ...updateEventDto };
    if (updateEventDto.startDate) {
      updateData.startDate = new Date(updateEventDto.startDate);
    }
    if (updateEventDto.endDate) {
      updateData.endDate = new Date(updateEventDto.endDate);
    }

    const event = await this.prisma.calendarEvent.update({
      where: { id },
      data: updateData,
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
        },
      },
    });

    return event;
  }

  async remove(userId: string, id: string) {
    const event = await this.prisma.calendarEvent.findFirst({
      where: { id, userId },
    });

    if (!event) {
      throw new NotFoundException('Calendar event not found');
    }

    await this.prisma.calendarEvent.delete({
      where: { id },
    });

    return { message: 'Calendar event deleted successfully' };
  }

  async getMonthView(userId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const events = await this.prisma.calendarEvent.findMany({
      where: {
        userId,
        OR: [
          {
            startDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            endDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gte: endDate } },
            ],
          },
        ],
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    // Group events by date
    const eventsByDate: Record<string, any[]> = {};
    
    events.forEach(event => {
      const eventDate = event.startDate.toISOString().split('T')[0];
      if (!eventsByDate[eventDate]) {
        eventsByDate[eventDate] = [];
      }
      eventsByDate[eventDate].push(event);
    });

    return {
      year,
      month,
      events: eventsByDate,
      totalEvents: events.length,
    };
  }

  async getWeekView(userId: string, startDate: string) {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59);

    const events = await this.prisma.calendarEvent.findMany({
      where: {
        userId,
        OR: [
          {
            startDate: {
              gte: start,
              lte: end,
            },
          },
          {
            endDate: {
              gte: start,
              lte: end,
            },
          },
          {
            AND: [
              { startDate: { lte: start } },
              { endDate: { gte: end } },
            ],
          },
        ],
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    return {
      startDate: start,
      endDate: end,
      events,
      totalEvents: events.length,
    };
  }

  async getDayView(userId: string, date: string) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const events = await this.prisma.calendarEvent.findMany({
      where: {
        userId,
        OR: [
          {
            startDate: {
              gte: start,
              lte: end,
            },
          },
          {
            endDate: {
              gte: start,
              lte: end,
            },
          },
          {
            AND: [
              { startDate: { lte: start } },
              { endDate: { gte: end } },
            ],
          },
        ],
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            dueDate: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    return {
      date: start,
      events,
      totalEvents: events.length,
    };
  }

  async syncTaskToCalendar(userId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, userId, isDeleted: false },
    });

    if (!task || !task.dueDate) {
      throw new NotFoundException('Task not found or has no due date');
    }

    // Check if calendar event already exists for this task
    const existingEvent = await this.prisma.calendarEvent.findFirst({
      where: { taskId, userId },
    });

    if (existingEvent) {
      // Update existing event
      return this.prisma.calendarEvent.update({
        where: { id: existingEvent.id },
        data: {
          title: task.title,
          description: task.description,
          startDate: task.dueDate,
          endDate: task.dueDate,
        },
        include: {
          task: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
            },
          },
        },
      });
    } else {
      // Create new event
      return this.prisma.calendarEvent.create({
        data: {
          userId,
          taskId,
          title: task.title,
          description: task.description,
          startDate: task.dueDate,
          endDate: task.dueDate,
          isAllDay: true,
        },
        include: {
          task: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
            },
          },
        },
      });
    }
  }
}