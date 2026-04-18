import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { StorageModule } from '../../shared/storage/storage.module';
import { CalendarModule } from '../calendar/calendar.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [StorageModule, CalendarModule, UsersModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule { }