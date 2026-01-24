import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';

export interface EmailNotification {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

export interface SmsNotification {
  to: string;
  message: string;
}

export interface WhatsAppNotification {
  to: string;
  message: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private emailService: EmailService,
    private smsService: SmsService,
  ) {}

  async sendEmail(notification: EmailNotification): Promise<void> {
    try {
      await this.emailService.sendEmail(notification);
      this.logger.log(`Email sent successfully to ${notification.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${notification.to}:`, error);
      throw error;
    }
  }

  async sendSMS(notification: SmsNotification): Promise<void> {
    try {
      await this.smsService.sendSms(notification);
      this.logger.log(`SMS sent successfully to ${notification.to}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${notification.to}:`, error);
      throw error;
    }
  }

  async sendWhatsApp(notification: WhatsAppNotification): Promise<void> {
    try {
      await this.smsService.sendWhatsApp(notification);
      this.logger.log(`WhatsApp message sent successfully to ${notification.to}`);
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp message to ${notification.to}:`, error);
      throw error;
    }
  }

  async checkSmsBalance(): Promise<any> {
    try {
      return await this.smsService.checkBalance();
    } catch (error) {
      this.logger.error('Failed to check SMS balance:', error);
      return { error: error.message };
    }
  }
}