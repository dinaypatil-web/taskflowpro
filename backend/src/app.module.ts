import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
// import { BullModule } from '@nestjs/bullmq';

import { PrismaModule } from './shared/prisma/prisma.module';
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

    // Redis/BullMQ for background jobs (disabled for development)
    // BullModule.forRootAsync({
    //   useFactory: () => ({
    //     connection: {
    //       host: process.env.REDIS_HOST || 'localhost',
    //       port: parseInt(process.env.REDIS_PORT) || 6379,
    //       password: process.env.REDIS_PASSWORD,
    //     },
    //   }),
    // }),

    // Core modules
    PrismaModule,
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
export class AppModule {}