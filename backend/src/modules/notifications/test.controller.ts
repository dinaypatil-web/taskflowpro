import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotificationService } from './notification.service';

@ApiTags('Test Notifications')
@Controller('test')
export class TestController {
  constructor(private notificationService: NotificationService) {}

  @Post('email')
  @ApiOperation({ summary: 'Test email sending' })
  @ApiResponse({ status: 200, description: 'Email sent successfully' })
  async testEmail(@Body() body: { to: string; subject?: string }) {
    try {
      await this.notificationService.sendEmail({
        to: body.to,
        subject: body.subject || 'Test Email from TaskFlow Pro',
        template: 'default',
        data: {
          message: 'This is a test email to verify your email configuration is working correctly.'
        }
      });
      
      return { 
        success: true, 
        message: `Test email sent successfully to ${body.to}` 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  @Post('sms')
  @ApiOperation({ summary: 'Test SMS sending' })
  @ApiResponse({ status: 200, description: 'SMS sent successfully' })
  async testSms(@Body() body: { to: string; message?: string }) {
    try {
      await this.notificationService.sendSMS({
        to: body.to,
        message: body.message || 'Test SMS from TaskFlow Pro. Your SMS configuration is working!'
      });
      
      return { 
        success: true, 
        message: `Test SMS sent successfully to ${body.to}` 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  @Post('whatsapp')
  @ApiOperation({ summary: 'Test WhatsApp sending' })
  @ApiResponse({ status: 200, description: 'WhatsApp message sent successfully' })
  async testWhatsApp(@Body() body: { to: string; message?: string }) {
    try {
      await this.notificationService.sendWhatsApp({
        to: body.to,
        message: body.message || 'Test WhatsApp message from TaskFlow Pro. Your WhatsApp configuration is working!'
      });
      
      return { 
        success: true, 
        message: `Test WhatsApp message sent successfully to ${body.to}` 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  @Get('sms-balance')
  @ApiOperation({ summary: 'Check SMS balance' })
  @ApiResponse({ status: 200, description: 'SMS balance retrieved successfully' })
  async checkSmsBalance() {
    try {
      const balance = await this.notificationService.checkSmsBalance();
      return { 
        success: true, 
        balance 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  @Get('status')
  @ApiOperation({ summary: 'Check notification services status' })
  @ApiResponse({ status: 200, description: 'Services status retrieved successfully' })
  async getStatus() {
    return {
      services: {
        email: {
          provider: 'Brevo',
          status: process.env.BREVO_API_KEY ? 'configured' : 'not configured',
          freeLimit: '300 emails/day'
        },
        sms: {
          provider: 'Fast2SMS',
          status: process.env.FAST2SMS_API_KEY ? 'configured' : 'not configured',
          freeCredits: '₹50'
        },
        whatsapp: {
          provider: 'Fast2SMS',
          status: process.env.FAST2SMS_API_KEY ? 'configured' : 'not configured',
          freeAccess: 'Yes'
        },
        backup_sms: {
          provider: 'MSG91',
          status: process.env.MSG91_API_KEY ? 'configured' : 'not configured',
          freeCredits: 'Testing credits'
        }
      },
      setup_guide: '/docs/api-setup-guide.md'
    };
  }
}