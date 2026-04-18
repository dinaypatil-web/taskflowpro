import apiClient from './client'

export interface WorkflowRule {
  subordinateId: string;
  allowedAssigneeIds: string[];
}

export interface Workflow {
  id: string;
  superiorId: string;
  rules: WorkflowRule[];
  updatedAt: string;
}

export const workflowsApi = {
  getMyTeamWorkflow: async () => {
    const response = await apiClient.get<Workflow>('/workflows/my-team')
    return response.data
  },

  updateWorkflow: async (rules: WorkflowRule[]) => {
    const response = await apiClient.post<Workflow>('/workflows/update', { rules })
    return response.data
  },
}
