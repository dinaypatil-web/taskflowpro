import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkflowsService, WorkflowRule } from './workflows.service';

@ApiTags('Workflows')
@Controller('workflows')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkflowsController {
  constructor(private workflowsService: WorkflowsService) {}

  @Get('my-team')
  @ApiOperation({ summary: 'Get workflow rules defined by the current user as superior' })
  @ApiResponse({ status: 200, description: 'Workflow rules retrieved successfully' })
  async getMyTeamWorkflow(@Request() req) {
    return this.workflowsService.getWorkflowBySuperior(req.user.id);
  }

  @Post('update')
  @ApiOperation({ summary: 'Update workflow rules for subordinates' })
  @ApiResponse({ status: 200, description: 'Workflow rules updated successfully' })
  async updateWorkflow(@Request() req, @Body('rules') rules: WorkflowRule[]) {
    return this.workflowsService.updateWorkflow(req.user.id, rules);
  }
}
