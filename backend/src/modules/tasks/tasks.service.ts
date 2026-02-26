import { Injectable, NotFoundException } from '@nestjs/common';
import { FirestoreService } from '../../shared/firestore/firestore.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { VoiceTaskDto } from './dto/voice-task.dto';

@Injectable()
export class TasksService {
  constructor(private firestore: FirestoreService) { }

  private get tasksCollection() {
    return this.firestore.collection('tasks');
  }

  private get taskStakeholdersCollection() {
    return this.firestore.collection('task_stakeholders');
  }

  async create(userId: string, createTaskDto: CreateTaskDto) {
    const { stakeholderIds, ...taskData } = createTaskDto;
    const now = new Date();

    const taskRef = this.tasksCollection.doc();
    const task = {
      ...taskData,
      userId,
      isVoiceCreated: false,
      voiceMetadata: null,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };

    await taskRef.set(task);

    if (stakeholderIds?.length) {
      const batch = this.firestore.getDb().batch();
      for (const stakeholderId of stakeholderIds) {
        const mappingRef = this.taskStakeholdersCollection.doc();
        batch.set(mappingRef, {
          taskId: taskRef.id,
          stakeholderId,
          role: 'assignee',
          createdAt: now,
        });
      }
      await batch.commit();
    }

    return this.findOne(userId, taskRef.id);
  }

  async createFromVoice(userId: string, voiceTaskDto: VoiceTaskDto) {
    const { stakeholderIds, voiceMetadata, ...taskData } = voiceTaskDto;
    const now = new Date();

    const taskRef = this.tasksCollection.doc();
    const task = {
      ...taskData,
      userId,
      isVoiceCreated: true,
      voiceMetadata: voiceMetadata ? JSON.stringify(voiceMetadata) : null,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };

    await taskRef.set(task);

    if (stakeholderIds?.length) {
      const batch = this.firestore.getDb().batch();
      for (const stakeholderId of stakeholderIds) {
        const mappingRef = this.taskStakeholdersCollection.doc();
        batch.set(mappingRef, {
          taskId: taskRef.id,
          stakeholderId,
          role: 'assignee',
          createdAt: now,
        });
      }
      await batch.commit();
    }

    return this.findOne(userId, taskRef.id);
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

    let firestoreQuery: any = this.tasksCollection
      .where('userId', '==', userId)
      .where('isDeleted', '==', false);

    if (status) {
      firestoreQuery = firestoreQuery.where('status', '==', status);
    }

    if (priority) {
      firestoreQuery = firestoreQuery.where('priority', '==', priority);
    }

    // Handle date range
    if (dueDateFrom) {
      firestoreQuery = firestoreQuery.where('dueDate', '>=', new Date(dueDateFrom));
    }
    if (dueDateTo) {
      firestoreQuery = firestoreQuery.where('dueDate', '<=', new Date(dueDateTo));
    }

    // Sorting and Pagination
    firestoreQuery = firestoreQuery.orderBy(sortBy, sortOrder);

    // Note: Search is limited in Firestore. For simple search, we'll perform it on the results if provided
    // or skip it for this basic migration. For production, Algolia or similar is recommended.

    const countSnapshot = await firestoreQuery.count().get();
    const total = countSnapshot.data().count;

    const offset = (page - 1) * limit;
    const snapshot = await firestoreQuery.offset(offset).limit(limit).get();

    const tasks = await Promise.all(snapshot.docs.map(async (doc) => {
      const taskData = doc.data();
      const stakeholders = await this.getTaskStakeholders(doc.id);
      return {
        id: doc.id,
        ...taskData,
        taskStakeholders: stakeholders,
        dueDate: taskData.dueDate?.toDate(),
        createdAt: taskData.createdAt?.toDate(),
        updatedAt: taskData.updatedAt?.toDate(),
      };
    }));

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
    const taskDoc = await this.tasksCollection.doc(id).get();

    if (!taskDoc.exists || taskDoc.data().userId !== userId || taskDoc.data().isDeleted) {
      throw new NotFoundException('Task not found');
    }

    const taskData = taskDoc.data();
    const stakeholders = await this.getTaskStakeholders(id);

    // Get reminders and calendar events associated (simplified for now)
    const [remindersSnapshot, calendarEventsSnapshot] = await Promise.all([
      this.firestore.collection('reminders').where('taskId', '==', id).orderBy('scheduledAt', 'asc').get(),
      this.firestore.collection('calendar_events').where('taskId', '==', id).get(),
    ]);

    return {
      id: taskDoc.id,
      ...taskData,
      taskStakeholders: stakeholders,
      reminders: remindersSnapshot.docs.map(d => ({ id: d.id, ...d.data() })),
      calendarEvents: calendarEventsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })),
      dueDate: taskData.dueDate?.toDate(),
      createdAt: taskData.createdAt?.toDate(),
      updatedAt: taskData.updatedAt?.toDate(),
    };
  }

  async update(userId: string, id: string, updateTaskDto: UpdateTaskDto) {
    const { stakeholderIds, ...taskData } = updateTaskDto;

    const taskRef = this.tasksCollection.doc(id);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists || taskDoc.data().userId !== userId || taskDoc.data().isDeleted) {
      throw new NotFoundException('Task not found');
    }

    const updatePayload: any = {
      ...taskData,
      updatedAt: new Date(),
    };

    if (taskData.status === 'COMPLETED') {
      updatePayload.completedAt = new Date();
    }

    await taskRef.update(updatePayload);

    if (stakeholderIds !== undefined) {
      const existingMappings = await this.taskStakeholdersCollection.where('taskId', '==', id).get();
      const batch = this.firestore.getDb().batch();

      existingMappings.docs.forEach(doc => batch.delete(doc.ref));

      for (const sId of stakeholderIds) {
        const mappingRef = this.taskStakeholdersCollection.doc();
        batch.set(mappingRef, {
          taskId: id,
          stakeholderId: sId,
          role: 'assignee',
          createdAt: new Date(),
        });
      }

      await batch.commit();
    }

    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string) {
    const taskRef = this.tasksCollection.doc(id);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists || taskDoc.data().userId !== userId || taskDoc.data().isDeleted) {
      throw new NotFoundException('Task not found');
    }

    await taskRef.update({
      isDeleted: true,
      deletedAt: new Date(),
      updatedAt: new Date(),
    });

    return { message: 'Task deleted successfully' };
  }

  async getTasksByStatus(userId: string) {
    const statuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE'];
    const counts = await Promise.all(statuses.map(async (status) => {
      const snapshot = await this.tasksCollection
        .where('userId', '==', userId)
        .where('isDeleted', '==', false)
        .where('status', '==', status)
        .count()
        .get();
      return { status, count: snapshot.data().count };
    }));

    return counts.reduce((acc, item) => {
      acc[item.status] = item.count;
      return acc;
    }, {} as Record<string, number>);
  }

  async getOverdueTasks(userId: string) {
    const now = new Date();

    const snapshot = await this.tasksCollection
      .where('userId', '==', userId)
      .where('isDeleted', '==', false)
      .where('status', '!=', 'COMPLETED')
      .where('dueDate', '<', now)
      .get();

    const overdueTasks = await Promise.all(snapshot.docs.map(async (doc) => {
      const data = doc.data();
      const stakeholders = await this.getTaskStakeholders(doc.id);

      // Update status to OVERDUE if not already
      if (data.status !== 'OVERDUE') {
        await doc.ref.update({ status: 'OVERDUE', updatedAt: new Date() });
      }

      return { id: doc.id, ...data, status: 'OVERDUE', taskStakeholders: stakeholders };
    }));

    return overdueTasks;
  }

  async getUpcomingTasks(userId: string, days: number = 7) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    const snapshot = await this.tasksCollection
      .where('userId', '==', userId)
      .where('isDeleted', '==', false)
      .where('dueDate', '>=', now)
      .where('dueDate', '<=', futureDate)
      .get();

    return Promise.all(snapshot.docs
      .filter(doc => !['COMPLETED', 'CANCELLED'].includes(doc.data().status))
      .map(async (doc) => {
        const data = doc.data();
        const stakeholders = await this.getTaskStakeholders(doc.id);
        return { id: doc.id, ...data, taskStakeholders: stakeholders };
      }));
  }

  private async getTaskStakeholders(taskId: string) {
    const snapshot = await this.taskStakeholdersCollection.where('taskId', '==', taskId).get();
    return Promise.all(snapshot.docs.map(async (doc) => {
      const mapping = doc.data();
      const stakeholderDoc = await this.firestore.collection('stakeholders').doc(mapping.stakeholderId).get();
      return {
        ...mapping,
        stakeholder: stakeholderDoc.exists ? { id: stakeholderDoc.id, ...stakeholderDoc.data() } : null,
      };
    }));
  }
}