import { Injectable, NotFoundException } from '@nestjs/common';
import { FirestoreService } from '../../shared/firestore/firestore.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private firestore: FirestoreService) { }

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