import { Module } from '@nestjs/common';
// import { BullModule } from '@nestjs/bullmq';
import { RemindersController } from './reminders.controller';
import { RemindersService } from './reminders.service';
// import { ReminderProcessor } from './processors/reminder.processor';
import { NotificationService } from '../notifications/notification.service';
import { EmailService } from '../notifications/services/email.service';
import { SmsService } from '../notifications/services/sms.service';

@Module({
  imports: [
    // BullModule.registerQueue({
    //   name: 'reminders',
    // }),
  ],
  controllers: [RemindersController],
  providers: [RemindersService, NotificationService, EmailService, SmsService],
  exports: [RemindersService],
})
export class RemindersModule {}