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
import { RemindersService } from './reminders.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { ReminderQueryDto } from './dto/reminder-query.dto';

@ApiTags('Reminders')
@Controller('reminders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new reminder' })
  @ApiResponse({ status: 201, description: 'Reminder created successfully' })
  create(@Request() req, @Body() createReminderDto: CreateReminderDto) {
    return this.remindersService.create(req.user.id, createReminderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reminders with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Reminders retrieved successfully' })
  findAll(@Request() req, @Query() query: ReminderQueryDto) {
    return this.remindersService.findAll(req.user.id, query);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending reminders for next 24 hours' })
  @ApiResponse({ status: 200, description: 'Pending reminders retrieved successfully' })
  getPendingReminders(@Request() req) {
    return this.remindersService.getPendingReminders(req.user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get reminder statistics' })
  @ApiResponse({ status: 200, description: 'Reminder statistics retrieved successfully' })
  getReminderStats(@Request() req) {
    return this.remindersService.getReminderStats(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific reminder' })
  @ApiResponse({ status: 200, description: 'Reminder retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Reminder not found' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.remindersService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a reminder' })
  @ApiResponse({ status: 200, description: 'Reminder updated successfully' })
  @ApiResponse({ status: 404, description: 'Reminder not found' })
  update(@Request() req, @Param('id') id: string, @Body() updateReminderDto: UpdateReminderDto) {
    return this.remindersService.update(req.user.id, id, updateReminderDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a reminder' })
  @ApiResponse({ status: 200, description: 'Reminder cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Reminder not found' })
  cancel(@Request() req, @Param('id') id: string) {
    return this.remindersService.cancel(req.user.id, id);
  }
}