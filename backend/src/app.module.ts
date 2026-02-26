import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
// import { BullModule } from '@nestjs/bullmq';

import { FirestoreModule } from './shared/firestore/firestore.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { StakeholdersModule } from './modules/stakeholders/stakeholders.module';
import { RemindersModule } from './modules/reminders/reminders.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Core modules
    FirestoreModule,
    AuthModule,
    UsersModule,
    TasksModule,
    StakeholdersModule,
    RemindersModule,
    CalendarModule,
    NotificationsModule,
    HealthModule,
  ],
})
export class AppModule { }