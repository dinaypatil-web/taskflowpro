import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { StorageModule } from '../../shared/storage/storage.module';
import { CalendarModule } from '../calendar/calendar.module';

@Module({
  imports: [StorageModule, CalendarModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule { }