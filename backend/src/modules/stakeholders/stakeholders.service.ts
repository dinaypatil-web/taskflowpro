import { Injectable, NotFoundException } from '@nestjs/common';
import { FirestoreService } from '../../shared/firestore/firestore.service';
import { CreateStakeholderDto } from './dto/create-stakeholder.dto';
import { UpdateStakeholderDto } from './dto/update-stakeholder.dto';
import { StakeholderQueryDto } from './dto/stakeholder-query.dto';

@Injectable()
export class StakeholdersService {
  constructor(private firestore: FirestoreService) { }

  private get stakeholdersCollection() {
    return this.firestore.collection('stakeholders');
  }

  private get taskStakeholdersCollection() {
    return this.firestore.collection('task_stakeholders');
  }

  async create(userId: string, createStakeholderDto: CreateStakeholderDto) {
    const { tags, ...stakeholderData } = createStakeholderDto;
    const now = new Date();

    const stakeholderRef = this.stakeholdersCollection.doc();
    const stakeholder = {
      ...stakeholderData,
      userId,
      tags: tags || [],
      isActive: true,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await stakeholderRef.set(stakeholder);
    return { id: stakeholderRef.id, ...stakeholder };
  }

  async createMany(userId: string, stakeholders: CreateStakeholderDto[]) {
    const batch = this.firestore.getDb().batch();
    const now = new Date();
    const results = [];

    stakeholders.forEach((dto) => {
      const { tags, ...stakeholderData } = dto;
      const docRef = this.stakeholdersCollection.doc();
      const stakeholder = {
        ...stakeholderData,
        userId,
        tags: tags || [],
        isActive: true,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };

      batch.set(docRef, stakeholder);
      results.push({ id: docRef.id, ...stakeholder });
    });

    await batch.commit();
    return results;
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

    let firestoreQuery: any = this.stakeholdersCollection
      .where('userId', '==', userId)
      .where('deletedAt', '==', null);

    if (organization) {
      firestoreQuery = firestoreQuery.where('organization', '==', organization);
    }

    if (tags && tags.length > 0) {
      // array-contains-any is ideal for tags filtering
      firestoreQuery = firestoreQuery.where('tags', 'array-contains-any', tags);
    }

    firestoreQuery = firestoreQuery.orderBy(sortBy, sortOrder);

    const countSnapshot = await firestoreQuery.count().get();
    const total = countSnapshot.data().count;

    const offset = (page - 1) * limit;
    const snapshot = await firestoreQuery.offset(offset).limit(limit).get();

    const stakeholders = await Promise.all(snapshot.docs.map(async (doc) => {
      const data = doc.data();
      const taskCountSnapshot = await this.taskStakeholdersCollection.where('stakeholderId', '==', doc.id).count().get();
      return {
        id: doc.id,
        ...data,
        _count: { taskStakeholders: taskCountSnapshot.data().count },
        createdAt: FirestoreService.safeToDate(data.createdAt),
        updatedAt: FirestoreService.safeToDate(data.updatedAt),
      };
    }));

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
    const stakeholderDoc = await this.stakeholdersCollection.doc(id).get();

    if (!stakeholderDoc.exists || stakeholderDoc.data().userId !== userId || stakeholderDoc.data().deletedAt !== null) {
      throw new NotFoundException('Stakeholder not found');
    }

    const stakeholderData = stakeholderDoc.data();

    // Get associated tasks
    const taskMappings = await this.taskStakeholdersCollection.where('stakeholderId', '==', id).get();
    const tasks = await Promise.all(taskMappings.docs.map(async (doc) => {
      const mapping = doc.data();
      const taskDoc = await this.firestore.collection('tasks').doc(mapping.taskId).get();
      return taskDoc.exists ? { id: taskDoc.id, ...taskDoc.data() } : null;
    }));

    // Get reminder logs
    const reminderLogsSnapshot = await this.firestore.collection('reminder_logs')
      .where('stakeholderId', '==', id)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    return {
      id: stakeholderDoc.id,
      ...stakeholderData,
      taskStakeholders: tasks.filter(Boolean).map(t => ({ task: t })),
      reminderLogs: reminderLogsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })),
      createdAt: FirestoreService.safeToDate(stakeholderData.createdAt),
      updatedAt: FirestoreService.safeToDate(stakeholderData.updatedAt),
    };
  }

  async update(userId: string, id: string, updateStakeholderDto: UpdateStakeholderDto) {
    const stakeholderRef = this.stakeholdersCollection.doc(id);
    const stakeholderDoc = await stakeholderRef.get();

    if (!stakeholderDoc.exists || stakeholderDoc.data().userId !== userId || stakeholderDoc.data().deletedAt !== null) {
      throw new NotFoundException('Stakeholder not found');
    }

    const { tags, ...updateData } = updateStakeholderDto;

    const payload: any = {
      ...updateData,
      updatedAt: new Date(),
    };
    if (tags) payload.tags = tags;

    await stakeholderRef.update(payload);

    const updated = await stakeholderRef.get();
    return { id: updated.id, ...updated.data() };
  }

  async remove(userId: string, id: string) {
    const stakeholderRef = this.stakeholdersCollection.doc(id);
    const stakeholderDoc = await stakeholderRef.get();

    if (!stakeholderDoc.exists || stakeholderDoc.data().userId !== userId || stakeholderDoc.data().deletedAt !== null) {
      throw new NotFoundException('Stakeholder not found');
    }

    await stakeholderRef.update({
      deletedAt: new Date(),
      isActive: false,
      updatedAt: new Date(),
    });

    return { message: 'Stakeholder deleted successfully' };
  }

  async getStakeholderStats(userId: string, stakeholderId: string) {
    const taskMappings = await this.taskStakeholdersCollection.where('stakeholderId', '==', stakeholderId).get();
    const taskIds = taskMappings.docs.map(doc => doc.data().taskId);

    if (taskIds.length === 0) {
      return { totalTasks: 0, completedTasks: 0, pendingTasks: 0, overdueTasks: 0, completionRate: 0 };
    }

    // Firestore In query is limited to 10 elements, so we might need chunks or different approach
    // For now, let's query all tasks for this user and filter in memory if taskIds are few, 
    // or better, just get counts by iterating if needed.

    let totalTasks = 0, completedTasks = 0, pendingTasks = 0, overdueTasks = 0;

    for (const taskId of taskIds) {
      const taskDoc = await this.firestore.collection('tasks').doc(taskId).get();
      if (taskDoc.exists && !taskDoc.data().isDeleted) {
        totalTasks++;
        const status = taskDoc.data().status;
        if (status === 'COMPLETED') completedTasks++;
        else if (status === 'PENDING') pendingTasks++;
        else if (status === 'OVERDUE') overdueTasks++;
      }
    }

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    };
  }

  async searchByContact(userId: string, contact: string) {
    // Firestore lacks complex OR, so we search by email and phone separately
    const [emailSnapshot, phoneSnapshot] = await Promise.all([
      this.stakeholdersCollection.where('userId', '==', userId).where('deletedAt', '==', null).where('email', '==', contact).limit(10).get(),
      this.stakeholdersCollection.where('userId', '==', userId).where('deletedAt', '==', null).where('phone', '==', contact).limit(10).get(),
    ]);

    const results = [...emailSnapshot.docs, ...phoneSnapshot.docs].map(doc => ({ id: doc.id, ...doc.data() }));
    // Deduplicate by ID
    return Array.from(new Map(results.map(item => [item.id, item])).values());
  }

  async getAllTags(userId: string) {
    const snapshot = await this.stakeholdersCollection
      .where('userId', '==', userId)
      .where('deletedAt', '==', null)
      .get();

    const allTags = snapshot.docs
      .map(doc => doc.data().tags || [])
      .flat();

    return [...new Set(allTags)].sort();
  }

  async getOrganizations(userId: string) {
    const snapshot = await this.stakeholdersCollection
      .where('userId', '==', userId)
      .where('deletedAt', '==', null)
      .get();

    const organizations = snapshot.docs
      .map(doc => doc.data().organization)
      .filter(Boolean);

    return [...new Set(organizations)].sort();
  }
}