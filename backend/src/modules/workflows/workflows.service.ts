import { Injectable, NotFoundException } from '@nestjs/common';
import { FirestoreService } from '../../shared/firestore/firestore.service';

export interface WorkflowRule {
  subordinateId: string;
  allowedAssigneeIds: string[]; // '*' for all subordinates of this superior
}

@Injectable()
export class WorkflowsService {
  constructor(private firestore: FirestoreService) { }

  private get workflowsCollection() {
    return this.firestore.collection('workflows');
  }

  async getWorkflowBySuperior(superiorId: string) {
    const snapshot = await this.workflowsCollection.where('superiorId', '==', superiorId).get();
    if (snapshot.empty) {
      return null;
    }
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  }

  async updateWorkflow(superiorId: string, rules: WorkflowRule[]) {
    const current = await this.getWorkflowBySuperior(superiorId);
    const now = new Date();

    if (current) {
      await this.workflowsCollection.doc((current as any).id).update({
        rules,
        updatedAt: now,
      });
      return { id: (current as any).id, superiorId, rules, updatedAt: now };
    } else {
      const docRef = this.workflowsCollection.doc();
      const workflow = {
        superiorId,
        rules,
        createdAt: now,
        updatedAt: now,
      };
      await docRef.set(workflow);
      return { id: docRef.id, ...workflow };
    }
  }

  async canSubordinateAssignTo(superiorId: string, subordinateId: string, assigneeId: string): Promise<boolean | null> {
    const workflow = await this.getWorkflowBySuperior(superiorId);
    if (!workflow) return null; // No custom rules, use defaults

    const rule = (workflow as any).rules.find(r => r.subordinateId === subordinateId);
    if (!rule) return null;

    if (rule.allowedAssigneeIds.includes('*')) return true;
    return rule.allowedAssigneeIds.includes(assigneeId);
  }
}
