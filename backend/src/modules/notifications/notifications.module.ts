import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';
import { TestController } from './test.controller';

@Module({
  controllers: [TestController],
  providers: [NotificationService, EmailService, SmsService],
  exports: [NotificationService],
})
export class NotificationsModule {}