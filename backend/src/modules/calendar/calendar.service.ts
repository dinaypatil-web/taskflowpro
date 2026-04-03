import { Injectable, NotFoundException } from '@nestjs/common';
import { FirestoreService } from '../../shared/firestore/firestore.service';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';
import { CalendarQueryDto } from './dto/calendar-query.dto';

@Injectable()
export class CalendarService {
  constructor(private firestore: FirestoreService) { }

  private get eventsCollection() {
    return this.firestore.collection('calendar_events');
  }

  async createEvent(userId: string, createEventDto: CreateCalendarEventDto) {
    const eventRef = this.eventsCollection.doc();
    const now = new Date();
    const event = {
      ...createEventDto,
      userId,
      startDate: new Date(createEventDto.startDate),
      endDate: new Date(createEventDto.endDate),
      createdAt: now,
      updatedAt: now,
    };

    await eventRef.set(event);
    return { id: eventRef.id, ...event };
  }

  async findEvents(userId: string, query: CalendarQueryDto) {
    const { startDate, endDate, taskId } = query;

    let firestoreQuery: any = this.eventsCollection.where('userId', '==', userId);

    if (taskId) {
      firestoreQuery = firestoreQuery.where('taskId', '==', taskId);
    }

    // To find overlapping events (startDate <= queryEndDate AND endDate >= queryStartDate)
    // Firestore only allows one inequality filter on different fields.
    // We'll query by startDate and filter endDate in memory.
    if (endDate) {
      firestoreQuery = firestoreQuery.where('startDate', '<=', new Date(endDate));
    }

    const snapshot = await firestoreQuery.orderBy('startDate', 'asc').get();

    return Promise.all(snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(data => {
        const queryStart = new Date(startDate);
        const eventEndDate = FirestoreService.safeToDate(data.endDate) || FirestoreService.safeToDate(data.startDate);
        const isNotCompleted = data.status !== 'COMPLETED';
        
        // Include if the event actually overlaps with the query range
        // OR if it's not completed (meaning it's ongoing and should be carried forward)
        return (eventEndDate && eventEndDate >= queryStart) || isNotCompleted;
      })
      .map(async (data) => {
        const taskDoc = data.taskId ? await this.firestore.collection('tasks').doc(data.taskId).get() : null;
        let task = null;
        if (taskDoc?.exists) {
          const taskData = taskDoc.data();
          task = {
            id: taskDoc.id,
            ...taskData,
            startDate: FirestoreService.safeToDate(taskData.startDate),
            dueDate: FirestoreService.safeToDate(taskData.dueDate),
            completedAt: FirestoreService.safeToDate(taskData.completedAt),
            createdAt: FirestoreService.safeToDate(taskData.createdAt),
            updatedAt: FirestoreService.safeToDate(taskData.updatedAt),
          };
        }

        return {
          ...data,
          task,
          startDate: FirestoreService.safeToDate(data.startDate),
          endDate: FirestoreService.safeToDate(data.endDate),
          dueDate: FirestoreService.safeToDate(data.dueDate),
          completedAt: FirestoreService.safeToDate(data.completedAt),
          createdAt: FirestoreService.safeToDate(data.createdAt),
          updatedAt: FirestoreService.safeToDate(data.updatedAt),
        };
      }));
  }

  async findOne(userId: string, id: string) {
    const eventDoc = await this.eventsCollection.doc(id).get();

    if (!eventDoc.exists || eventDoc.data().userId !== userId) {
      throw new NotFoundException('Calendar event not found');
    }

    const data = eventDoc.data();
    const taskDoc = data.taskId ? await this.firestore.collection('tasks').doc(data.taskId).get() : null;

    return {
      id: eventDoc.id,
      ...data,
      task: taskDoc?.exists ? {
        id: taskDoc.id,
        ...taskDoc.data(),
        startDate: FirestoreService.safeToDate(taskDoc.data().startDate),
        dueDate: FirestoreService.safeToDate(taskDoc.data().dueDate),
        completedAt: FirestoreService.safeToDate(taskDoc.data().completedAt),
        createdAt: FirestoreService.safeToDate(taskDoc.data().createdAt),
        updatedAt: FirestoreService.safeToDate(taskDoc.data().updatedAt),
      } : null,
      startDate: FirestoreService.safeToDate(data.startDate),
      endDate: FirestoreService.safeToDate(data.endDate),
      dueDate: FirestoreService.safeToDate(data.dueDate),
      completedAt: FirestoreService.safeToDate(data.completedAt),
      createdAt: FirestoreService.safeToDate(data.createdAt),
      updatedAt: FirestoreService.safeToDate(data.updatedAt),
    };
  }

  async update(userId: string, id: string, updateEventDto: UpdateCalendarEventDto) {
    const eventRef = this.eventsCollection.doc(id);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists || eventDoc.data().userId !== userId) {
      throw new NotFoundException('Calendar event not found');
    }

    const updateData: any = {
      ...updateEventDto,
      updatedAt: new Date(),
    };
    if (updateEventDto.startDate) updateData.startDate = new Date(updateEventDto.startDate);
    if (updateEventDto.endDate) updateData.endDate = new Date(updateEventDto.endDate);

    await eventRef.update(updateData);
    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string) {
    const eventRef = this.eventsCollection.doc(id);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists || eventDoc.data().userId !== userId) {
      throw new NotFoundException('Calendar event not found');
    }

    await eventRef.delete();
    return { message: 'Calendar event deleted successfully' };
  }

  async removeByTaskId(userId: string, taskId: string) {
    const snapshot = await this.eventsCollection
      .where('userId', '==', userId)
      .where('taskId', '==', taskId)
      .get();

    if (snapshot.empty) {
      return { message: 'No calendar events found for this task' };
    }

    const batch = this.firestore.getDb().batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    return { message: `Deleted ${snapshot.size} calendar events` };
  }

  async getMonthView(userId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const events = await this.findEvents(userId, { startDate: startDate.toISOString(), endDate: endDate.toISOString() });

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

    const events = await this.findEvents(userId, { startDate: start.toISOString(), endDate: end.toISOString() });

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

    const events = await this.findEvents(userId, { startDate: start.toISOString(), endDate: end.toISOString() });

    return {
      date: start,
      events,
      totalEvents: events.length,
    };
  }

  async syncTaskToCalendar(userId: string, taskId: string) {
    const taskDoc = await this.firestore.collection('tasks').doc(taskId).get();

    if (!taskDoc.exists || taskDoc.data().userId !== userId) {
      throw new NotFoundException('Task not found');
    }

    const task = taskDoc.data();

    // If no dates, we can't sync to calendar
    if (!task.startDate && !task.dueDate && !task.createdAt) {
      return null;
    }

    const taskStartDate = FirestoreService.safeToDate(task.startDate) || FirestoreService.safeToDate(task.createdAt);
    const taskEndDate = FirestoreService.safeToDate(task.completedAt) || FirestoreService.safeToDate(task.dueDate) || taskStartDate;

    const existingEvents = await this.eventsCollection.where('taskId', '==', taskId).where('userId', '==', userId).limit(1).get();

    const eventData = {
      userId,
      taskId,
      title: task.title,
      description: task.description,
      startDate: taskStartDate,
      endDate: taskEndDate,
      status: task.status,
      dueDate: task.dueDate,
      completedAt: task.completedAt,
      isAllDay: true,
      updatedAt: new Date(),
    };

    if (!existingEvents.empty) {
      const eventRef = existingEvents.docs[0].ref;
      await eventRef.update(eventData);
      return this.findOne(userId, eventRef.id);
    } else {
      const eventRef = this.eventsCollection.doc();
      await eventRef.set({
        ...eventData,
        createdAt: new Date(),
      });
      return this.findOne(userId, eventRef.id);
    }
  }
}