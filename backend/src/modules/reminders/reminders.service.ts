import { Injectable, NotFoundException } from '@nestjs/common';
import { FirestoreService } from '../../shared/firestore/firestore.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { ReminderQueryDto } from './dto/reminder-query.dto';

@Injectable()
export class RemindersService {
  constructor(private firestore: FirestoreService) { }

  private get remindersCollection() {
    return this.firestore.collection('reminders');
  }

  async create(userId: string, createReminderDto: CreateReminderDto) {
    const { taskId, ...reminderData } = createReminderDto;

    // Verify task belongs to user
    const taskDoc = await this.firestore.collection('tasks').doc(taskId).get();
    if (!taskDoc.exists || taskDoc.data().userId !== userId) {
      throw new NotFoundException('Task not found');
    }

    const reminderRef = this.remindersCollection.doc();
    const now = new Date();
    const reminder = {
      ...reminderData,
      taskId,
      userId, // Denormalize userId for easy querying
      status: 'PENDING',
      attempts: 0,
      createdAt: now,
      updatedAt: now,
    };

    await reminderRef.set(reminder);

    return { id: reminderRef.id, ...reminder };
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

    let firestoreQuery: any = this.remindersCollection.where('userId', '==', userId);

    if (status) {
      firestoreQuery = firestoreQuery.where('status', '==', status);
    }
    if (type) {
      firestoreQuery = firestoreQuery.where('type', '==', type);
    }
    if (taskId) {
      firestoreQuery = firestoreQuery.where('taskId', '==', taskId);
    }

    firestoreQuery = firestoreQuery.orderBy(sortBy, sortOrder);

    const countSnapshot = await firestoreQuery.count().get();
    const total = countSnapshot.data().count;

    const offset = (page - 1) * limit;
    const snapshot = await firestoreQuery.offset(offset).limit(limit).get();

    const reminders = await Promise.all(snapshot.docs.map(async (doc) => {
      const data = doc.data();
      const taskDoc = await this.firestore.collection('tasks').doc(data.taskId).get();
      return {
        id: doc.id,
        ...data,
        task: taskDoc.exists ? { id: taskDoc.id, ...taskDoc.data() } : null,
        scheduledAt: data.scheduledAt?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      };
    }));

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
    const reminderDoc = await this.remindersCollection.doc(id).get();

    if (!reminderDoc.exists || reminderDoc.data().userId !== userId) {
      throw new NotFoundException('Reminder not found');
    }

    const data = reminderDoc.data();
    const [taskDoc, logsSnapshot] = await Promise.all([
      this.firestore.collection('tasks').doc(data.taskId).get(),
      this.firestore.collection('reminder_logs').where('reminderId', '==', id).orderBy('createdAt', 'desc').get(),
    ]);

    return {
      id: reminderDoc.id,
      ...data,
      task: taskDoc.exists ? { id: taskDoc.id, ...taskDoc.data() } : null,
      reminderLogs: logsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })),
      scheduledAt: data.scheduledAt?.toDate(),
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    };
  }

  async update(userId: string, id: string, updateReminderDto: UpdateReminderDto) {
    const reminderRef = this.remindersCollection.doc(id);
    const reminderDoc = await reminderRef.get();

    if (!reminderDoc.exists || reminderDoc.data().userId !== userId) {
      throw new NotFoundException('Reminder not found');
    }

    await reminderRef.update({
      ...updateReminderDto,
      updatedAt: new Date(),
    });

    return this.findOne(userId, id);
  }

  async cancel(userId: string, id: string) {
    const reminderRef = this.remindersCollection.doc(id);
    const reminderDoc = await reminderRef.get();

    if (!reminderDoc.exists || reminderDoc.data().userId !== userId) {
      throw new NotFoundException('Reminder not found');
    }

    await reminderRef.update({ status: 'CANCELLED', updatedAt: new Date() });
    return { message: 'Reminder cancelled successfully' };
  }

  async createTaskDueReminder(taskId: string, scheduledAt: Date) {
    const taskDoc = await this.firestore.collection('tasks').doc(taskId).get();
    if (!taskDoc.exists) return;

    const taskData = taskDoc.data();
    const reminderRef = this.remindersCollection.doc();
    const reminder = {
      taskId,
      userId: taskData.userId,
      type: 'TASK_DUE',
      scheduledAt,
      message: `Task "${taskData.title}" is due soon`,
      status: 'PENDING',
      attempts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await reminderRef.set(reminder);
    return { id: reminderRef.id, ...reminder };
  }

  async createOverdueReminder(taskId: string) {
    const taskDoc = await this.firestore.collection('tasks').doc(taskId).get();
    if (!taskDoc.exists) return;

    const taskData = taskDoc.data();
    const reminderRef = this.remindersCollection.doc();
    const reminder = {
      taskId,
      userId: taskData.userId,
      type: 'TASK_OVERDUE',
      scheduledAt: new Date(),
      message: `Task "${taskData.title}" is overdue`,
      status: 'PENDING',
      attempts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await reminderRef.set(reminder);
    return { id: reminderRef.id, ...reminder };
  }

  async getPendingReminders(userId: string) {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const snapshot = await this.remindersCollection
      .where('userId', '==', userId)
      .where('status', '==', 'PENDING')
      .where('scheduledAt', '<=', tomorrow)
      .orderBy('scheduledAt', 'asc')
      .get();

    return Promise.all(snapshot.docs.map(async (doc) => {
      const data = doc.data();
      const taskDoc = await this.firestore.collection('tasks').doc(data.taskId).get();
      return {
        id: doc.id,
        ...data,
        task: taskDoc.exists ? { id: taskDoc.id, title: taskDoc.data().title, dueDate: taskDoc.data().dueDate?.toDate() } : null,
        scheduledAt: data.scheduledAt?.toDate(),
      };
    }));
  }

  async getReminderStats(userId: string) {
    const statuses = ['SENT', 'PENDING', 'FAILED'];
    const counts = await Promise.all(statuses.map(async (status) => {
      const snapshot = await this.remindersCollection
        .where('userId', '==', userId)
        .where('status', '==', status)
        .count()
        .get();
      return { status, count: snapshot.data().count };
    }));

    const totalSnapshot = await this.remindersCollection.where('userId', '==', userId).count().get();
    const totalReminders = totalSnapshot.data().count;

    const stats = counts.reduce((acc, item) => {
      acc[item.status] = item.count;
      return acc;
    }, {} as any);

    return {
      totalReminders,
      sentReminders: stats.SENT || 0,
      pendingReminders: stats.PENDING || 0,
      failedReminders: stats.FAILED || 0,
      successRate: totalReminders > 0 ? ((stats.SENT || 0) / totalReminders) * 100 : 0,
    };
  }
}