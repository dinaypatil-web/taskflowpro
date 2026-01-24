import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import axios from 'axios';
import { EmailNotification } from '../notification.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private brevoApiKey: string;
  private useBrevo: boolean;

  constructor(private configService: ConfigService) {
    this.brevoApiKey = this.configService.get('BREVO_API_KEY');
    this.useBrevo = !!this.brevoApiKey;
    
    if (!this.useBrevo) {
      this.initializeTransporter();
    }
  }

  private initializeTransporter() {
    const emailConfig = {
      host: this.configService.get('SMTP_HOST', 'smtp-relay.brevo.com'),
      port: this.configService.get('SMTP_PORT', 587),
      secure: this.configService.get('SMTP_SECURE', false),
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    };

    this.transporter = nodemailer.createTransport(emailConfig);
  }

  async sendEmail(notification: EmailNotification): Promise<void> {
    const { to, subject, template, data } = notification;

    if (this.useBrevo) {
      await this.sendViaBrevo(to, subject, template, data);
    } else {
      await this.sendViaNodemailer(to, subject, template, data);
    }
  }

  private async sendViaBrevo(to: string, subject: string, template: string, data: Record<string, any>): Promise<void> {
    const htmlContent = this.generateEmailTemplate(template, data);
    
    const payload = {
      sender: {
        name: 'TaskFlow Pro',
        email: this.configService.get('FROM_EMAIL', 'noreply@taskflowpro.com')
      },
      to: [{ email: to }],
      subject,
      htmlContent
    };

    try {
      const response = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        payload,
        {
          headers: {
            'api-key': this.brevoApiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      
      this.logger.log(`Email sent via Brevo: ${response.data.messageId}`);
    } catch (error) {
      this.logger.error('Failed to send email via Brevo:', error.response?.data || error.message);
      throw error;
    }
  }

  private async sendViaNodemailer(to: string, subject: string, template: string, data: Record<string, any>): Promise<void> {
    const htmlContent = this.generateEmailTemplate(template, data);

    const mailOptions = {
      from: this.configService.get('SMTP_FROM', 'TaskFlow Pro <noreply@taskflowpro.com>'),
      to,
      subject,
      html: htmlContent,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully: ${result.messageId}`);
    } catch (error) {
      this.logger.error('Failed to send email:', error);
      throw error;
    }
  }

  private generateEmailTemplate(template: string, data: Record<string, any>): string {
    switch (template) {
      case 'task-reminder':
        return this.taskReminderTemplate(data);
      case 'verification':
        return this.verificationTemplate(data);
      case 'password-reset':
        return this.passwordResetTemplate(data);
      default:
        return this.defaultTemplate(data);
    }
  }

  private taskReminderTemplate(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Task Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2C3E50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .task-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .priority-high { border-left: 4px solid #E74C3C; }
          .priority-medium { border-left: 4px solid #F39C12; }
          .priority-low { border-left: 4px solid #27AE60; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Task Reminder</h1>
          </div>
          <div class="content">
            <p>Hello ${data.stakeholderName},</p>
            <p>This is a reminder about the following task:</p>
            
            <div class="task-details priority-${data.priority?.toLowerCase() || 'medium'}">
              <h3>${data.taskTitle}</h3>
              ${data.taskDescription ? `<p><strong>Description:</strong> ${data.taskDescription}</p>` : ''}
              ${data.dueDate ? `<p><strong>Due Date:</strong> ${new Date(data.dueDate).toLocaleDateString()}</p>` : ''}
              <p><strong>Priority:</strong> ${data.priority || 'Medium'}</p>
            </div>
            
            <p>Please take the necessary action to complete this task on time.</p>
            <p>Best regards,<br>${data.senderName}</p>
          </div>
          <div class="footer">
            <p>This email was sent by TaskFlow Pro on behalf of ${data.senderName}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private verificationTemplate(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Account</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #16A085; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .verify-button { 
            display: inline-block; 
            background: #16A085; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Verify Your Account</h1>
          </div>
          <div class="content">
            <p>Hello ${data.name},</p>
            <p>Thank you for signing up for TaskFlow Pro! Please verify your account by clicking the button below:</p>
            
            <div style="text-align: center;">
              <a href="${data.verificationUrl}" class="verify-button">Verify Account</a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p>${data.verificationUrl}</p>
            
            <p>This verification link will expire in 24 hours.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private passwordResetTemplate(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #E67E22; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .reset-button { 
            display: inline-block; 
            background: #E67E22; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Reset Your Password</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You requested to reset your password for TaskFlow Pro. Click the button below to reset it:</p>
            
            <div style="text-align: center;">
              <a href="${data.resetUrl}" class="reset-button">Reset Password</a>
            </div>
            
            <p>If you didn't request this password reset, please ignore this email.</p>
            <p>This reset link will expire in 24 hours.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private defaultTemplate(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>TaskFlow Pro Notification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>TaskFlow Pro Notification</h2>
          <p>${data.message || 'You have a new notification from TaskFlow Pro.'}</p>
        </div>
      </body>
      </html>
    `;
  }
}