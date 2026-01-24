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
import { CalendarService } from './calendar.service';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';
import { CalendarQueryDto } from './dto/calendar-query.dto';

@ApiTags('Calendar')
@Controller('calendar')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post('events')
  @ApiOperation({ summary: 'Create a new calendar event' })
  @ApiResponse({ status: 201, description: 'Calendar event created successfully' })
  createEvent(@Request() req, @Body() createEventDto: CreateCalendarEventDto) {
    return this.calendarService.createEvent(req.user.id, createEventDto);
  }

  @Get('events')
  @ApiOperation({ summary: 'Get calendar events with filtering' })
  @ApiResponse({ status: 200, description: 'Calendar events retrieved successfully' })
  findEvents(@Request() req, @Query() query: CalendarQueryDto) {
    return this.calendarService.findEvents(req.user.id, query);
  }

  @Get('month/:year/:month')
  @ApiOperation({ summary: 'Get month view of calendar' })
  @ApiResponse({ status: 200, description: 'Month view retrieved successfully' })
  getMonthView(
    @Request() req,
    @Param('year') year: string,
    @Param('month') month: string,
  ) {
    return this.calendarService.getMonthView(req.user.id, parseInt(year), parseInt(month));
  }

  @Get('week')
  @ApiOperation({ summary: 'Get week view of calendar' })
  @ApiResponse({ status: 200, description: 'Week view retrieved successfully' })
  getWeekView(@Request() req, @Query('startDate') startDate: string) {
    return this.calendarService.getWeekView(req.user.id, startDate);
  }

  @Get('day')
  @ApiOperation({ summary: 'Get day view of calendar' })
  @ApiResponse({ status: 200, description: 'Day view retrieved successfully' })
  getDayView(@Request() req, @Query('date') date: string) {
    return this.calendarService.getDayView(req.user.id, date);
  }

  @Post('sync-task/:taskId')
  @ApiOperation({ summary: 'Sync task to calendar' })
  @ApiResponse({ status: 201, description: 'Task synced to calendar successfully' })
  syncTaskToCalendar(@Request() req, @Param('taskId') taskId: string) {
    return this.calendarService.syncTaskToCalendar(req.user.id, taskId);
  }

  @Get('events/:id')
  @ApiOperation({ summary: 'Get a specific calendar event' })
  @ApiResponse({ status: 200, description: 'Calendar event retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Calendar event not found' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.calendarService.findOne(req.user.id, id);
  }

  @Patch('events/:id')
  @ApiOperation({ summary: 'Update a calendar event' })
  @ApiResponse({ status: 200, description: 'Calendar event updated successfully' })
  @ApiResponse({ status: 404, description: 'Calendar event not found' })
  update(@Request() req, @Param('id') id: string, @Body() updateEventDto: UpdateCalendarEventDto) {
    return this.calendarService.update(req.user.id, id, updateEventDto);
  }

  @Delete('events/:id')
  @ApiOperation({ summary: 'Delete a calendar event' })
  @ApiResponse({ status: 200, description: 'Calendar event deleted successfully' })
  @ApiResponse({ status: 404, description: 'Calendar event not found' })
  remove(@Request() req, @Param('id') id: string) {
    return this.calendarService.remove(req.user.id, id);
  }
}