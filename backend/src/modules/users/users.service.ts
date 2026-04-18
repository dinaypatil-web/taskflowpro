import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { FirestoreService } from '../../shared/firestore/firestore.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { WorkflowsService } from '../workflows/workflows.service';

@Injectable()
export class UsersService {
  constructor(
    private firestore: FirestoreService,
    @Inject(forwardRef(() => WorkflowsService))
    private workflowsService: WorkflowsService,
  ) { }

  private get usersCollection() {
    return this.firestore.collection('users');
  }

  async findById(id: string) {
    const userDoc = await this.usersCollection.doc(id).get();

    if (!userDoc.exists) {
      throw new NotFoundException('User not found');
    }

    const userData = userDoc.data();
    const { password: _, ...result } = userData;
    return { id: userDoc.id, ...result };
  }

  async findByEmail(email: string) {
    const snapshot = await this.usersCollection
      .where('email', '==', email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    return { id: userDoc.id, ...userData };
  }

  async updateProfile(userId: string, updateUserDto: UpdateUserDto) {
    const userRef = this.usersCollection.doc(userId);

    await userRef.update({
      ...updateUserDto,
      updatedAt: new Date(),
    });

    const updatedUserDoc = await userRef.get();
    const userData = updatedUserDoc.data();
    const { password: _, ...result } = userData;
    return { id: updatedUserDoc.id, ...result };
  }

  async getAvailableSuperiors(userId: string, organization?: string) {
    let query: any = this.usersCollection.where('isActive', '==', true);

    if (organization) {
      query = query.where('organization', '==', organization);
    }

    const snapshot = await query.get();
    return snapshot.docs
      .filter(doc => doc.id !== userId)
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          firstName: data.firstName,
          lastName: data.lastName,
          organization: data.organization,
          department: data.department,
        };
      });
  }

  async getSubordinates(superiorId: string) {
    const snapshot = await this.usersCollection
      .where('superiorId', '==', superiorId)
      .where('isActive', '==', true)
      .get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        firstName: data.firstName,
        lastName: data.lastName,
        department: data.department,
      };
    });
  }

  async getAvailableAssignees(userId: string) {
    const user = await this.findById(userId);
    const { organization, projectName, superiorId } = user as any;

    if (!organization || !projectName) {
      return []; // Must belong to org/project to use this feature
    }

    // Role: Project Head (can assign to anyone in project)
    if ((user as any).isProjectHead) {
      const allProjectUsersSnapshot = await this.usersCollection
        .where('organization', '==', organization)
        .where('projectName', '==', projectName)
        .where('isActive', '==', true)
        .get();
      
      return allProjectUsersSnapshot.docs
        .filter(doc => doc.id !== userId)
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            firstName: data.firstName,
            lastName: data.lastName,
            department: data.department,
          };
        });
    }

    // Rule 1: Subordinates (people who report to me)
    const subordinatesSnapshot = await this.usersCollection
      .where('superiorId', '==', userId)
      .where('organization', '==', organization)
      .where('projectName', '==', projectName)
      .get();

    // Rule 2: Peers (people with the same superior)
    let peersSnapshotDocs = [];
    if (superiorId) {
      const peersSnapshot = await this.usersCollection
        .where('superiorId', '==', superiorId)
        .where('organization', '==', organization)
        .where('projectName', '==', projectName)
        .get();
      peersSnapshotDocs = peersSnapshot.docs.filter(doc => doc.id !== userId);
    }

    const allAssignees = [...subordinatesSnapshot.docs, ...peersSnapshotDocs];
    // Deduplicate and sanitize
    const uniqueMap = new Map();
    allAssignees.forEach(doc => {
      const data = doc.data();
      uniqueMap.set(doc.id, {
        id: doc.id,
        firstName: data.firstName,
        lastName: data.lastName,
        department: data.department,
      });
    });

    return Array.from(uniqueMap.values());
  }

  async canAssignTaskTo(assignerId: string, assigneeId: string): Promise<boolean> {
    const [assigner, assignee] = await Promise.all([
      this.findById(assignerId),
      this.findById(assigneeId),
    ]);

    const u1 = assigner as any;
    const u2 = assignee as any;

    // Must be in same organization and project
    if (u1.organization !== u2.organization || u1.projectName !== u2.projectName) {
      return false;
    }

    // Rule 1: Assignee reports to Assigner
    if (u2.superiorId === assignerId) {
      return true;
    }

    // Rule: Project Head Privilege
    if (u1.isProjectHead) {
      return true; // Project Heads can assign to anyone in their project/org (checked above)
    }

    // Rule 2: Both report to same superior
    if (u1.superiorId && u1.superiorId === u2.superiorId) {
      // Check for custom restrictions defined by the superior
      const customRule = await this.workflowsService.canSubordinateAssignTo(u1.superiorId, assignerId, assigneeId);
      if (customRule !== null) {
        return customRule;
      }
      return true; // Default to true for peers
    }

    // Rule 3: Superior-defined workflows (TBD in Phase 4)
    // For now, only basic rules
    return false;
  }

  async deactivateAccount(userId: string) {
    await this.usersCollection.doc(userId).update({
      isActive: false,
      deletedAt: new Date(),
      updatedAt: new Date(),
    });

    return { message: 'Account deactivated successfully' };
  }

  async getUserStats(userId: string) {
    // Note: Firestore doesn't have a direct aggregate count for multiple collections.
    // We use multiple queries to get counts for different entities.

    const [totalTasksSnapshot, completedTasksSnapshot, pendingTasksSnapshot, totalStakeholdersSnapshot] = await Promise.all([
      this.firestore.collection('tasks').where('userId', '==', userId).where('isDeleted', '==', false).count().get(),
      this.firestore.collection('tasks').where('userId', '==', userId).where('status', '==', 'COMPLETED').where('isDeleted', '==', false).count().get(),
      this.firestore.collection('tasks').where('userId', '==', userId).where('status', '==', 'PENDING').where('isDeleted', '==', false).count().get(),
      this.firestore.collection('stakeholders').where('userId', '==', userId).where('deletedAt', '==', null).count().get(),
    ]);

    const totalTasks = totalTasksSnapshot.data().count;
    const completedTasks = completedTasksSnapshot.data().count;
    const pendingTasks = pendingTasksSnapshot.data().count;
    const totalStakeholders = totalStakeholdersSnapshot.data().count;

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      totalStakeholders,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    };
  }
}