import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { VoiceTaskDto } from './dto/voice-task.dto';

@ApiTags('Tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  create(@Request() req, @Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(req.user.id, createTaskDto);
  }

  @Post('voice')
  @ApiOperation({ summary: 'Create a task from voice input' })
  @ApiResponse({ status: 201, description: 'Voice task created successfully' })
  createFromVoice(@Request() req, @Body() voiceTaskDto: VoiceTaskDto) {
    return this.tasksService.createFromVoice(req.user.id, voiceTaskDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Tasks retrieved successfully' })
  findAll(@Request() req, @Query() query: TaskQueryDto) {
    return this.tasksService.findAll(req.user.id, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get task statistics by status' })
  @ApiResponse({ status: 200, description: 'Task statistics retrieved successfully' })
  getTaskStats(@Request() req) {
    return this.tasksService.getTasksByStatus(req.user.id);
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Get overdue tasks' })
  @ApiResponse({ status: 200, description: 'Overdue tasks retrieved successfully' })
  getOverdueTasks(@Request() req) {
    return this.tasksService.getOverdueTasks(req.user.id);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming tasks' })
  @ApiResponse({ status: 200, description: 'Upcoming tasks retrieved successfully' })
  getUpcomingTasks(@Request() req, @Query('days') days?: number) {
    return this.tasksService.getUpcomingTasks(req.user.id, days);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific task' })
  @ApiResponse({ status: 200, description: 'Task retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.tasksService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  update(@Request() req, @Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.update(req.user.id, id, updateTaskDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  remove(@Request() req, @Param('id') id: string) {
    return this.tasksService.remove(req.user.id, id);
  }
}