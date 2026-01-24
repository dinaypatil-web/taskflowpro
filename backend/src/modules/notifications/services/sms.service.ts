import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { SmsNotification } from '../notification.service';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private fast2smsApiKey: string;
  private fast2smsUrl = 'https://www.fast2sms.com/dev/bulkV2';

  constructor(private configService: ConfigService) {
    this.fast2smsApiKey = this.configService.get('FAST2SMS_API_KEY');
  }

  async sendSms(notification: SmsNotification): Promise<void> {
    const { to, message } = notification;

    if (!this.fast2smsApiKey) {
      this.logger.warn('Fast2SMS API key not configured, SMS not sent');
      return;
    }

    // Remove country code if present (Fast2SMS expects 10-digit Indian numbers)
    const phoneNumber = this.formatPhoneNumber(to);
    
    const payload = {
      route: 'q', // Quick route for transactional messages
      message: message,
      language: 'english',
      flash: 0,
      numbers: phoneNumber,
    };

    try {
      const response = await axios.post(this.fast2smsUrl, payload, {
        headers: {
          'authorization': this.fast2smsApiKey,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.return === true) {
        this.logger.log(`SMS sent successfully via Fast2SMS: ${response.data.request_id}`);
      } else {
        this.logger.error('Fast2SMS API error:', response.data.message);
        throw new Error(`Fast2SMS error: ${response.data.message}`);
      }
    } catch (error) {
      this.logger.error('Failed to send SMS via Fast2SMS:', error.response?.data || error.message);
      throw error;
    }
  }

  async sendWhatsApp(notification: SmsNotification): Promise<void> {
    const { to, message } = notification;

    if (!this.fast2smsApiKey) {
      this.logger.warn('Fast2SMS API key not configured, WhatsApp message not sent');
      return;
    }

    // Format phone number for WhatsApp (with country code)
    const phoneNumber = this.formatWhatsAppNumber(to);
    
    const payload = {
      route: 'wa', // WhatsApp route
      message: message,
      numbers: phoneNumber,
    };

    try {
      const response = await axios.post('https://www.fast2sms.com/dev/wa', payload, {
        headers: {
          'authorization': this.fast2smsApiKey,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.return === true) {
        this.logger.log(`WhatsApp message sent successfully via Fast2SMS: ${response.data.request_id}`);
      } else {
        this.logger.error('Fast2SMS WhatsApp API error:', response.data.message);
        throw new Error(`Fast2SMS WhatsApp error: ${response.data.message}`);
      }
    } catch (error) {
      this.logger.error('Failed to send WhatsApp message via Fast2SMS:', error.response?.data || error.message);
      throw error;
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If it starts with +91 or 91, remove it
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      cleaned = cleaned.substring(2);
    }
    
    // Ensure it's a 10-digit Indian number
    if (cleaned.length === 10 && cleaned.match(/^[6-9]\d{9}$/)) {
      return cleaned;
    }
    
    throw new Error(`Invalid Indian phone number format: ${phone}`);
  }

  private formatWhatsAppNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Add country code if not present
    if (cleaned.length === 10 && cleaned.match(/^[6-9]\d{9}$/)) {
      cleaned = '91' + cleaned;
    } else if (cleaned.startsWith('91') && cleaned.length === 12) {
      // Already has country code
    } else {
      throw new Error(`Invalid phone number format for WhatsApp: ${phone}`);
    }
    
    return cleaned;
  }

  // Alternative method using MSG91 (backup service)
  async sendSmsViaMSG91(notification: SmsNotification): Promise<void> {
    const msg91ApiKey = this.configService.get('MSG91_API_KEY');
    const msg91SenderId = this.configService.get('MSG91_SENDER_ID', 'TXTLCL');
    
    if (!msg91ApiKey) {
      this.logger.warn('MSG91 API key not configured');
      return;
    }

    const { to, message } = notification;
    const phoneNumber = this.formatPhoneNumber(to);

    const payload = {
      sender: msg91SenderId,
      route: '4', // Transactional route
      country: '91',
      sms: [
        {
          message: message,
          to: [phoneNumber]
        }
      ]
    };

    try {
      const response = await axios.post(
        `https://api.msg91.com/api/v5/sms/`,
        payload,
        {
          headers: {
            'authkey': msg91ApiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      this.logger.log(`SMS sent successfully via MSG91: ${response.data.request_id}`);
    } catch (error) {
      this.logger.error('Failed to send SMS via MSG91:', error.response?.data || error.message);
      throw error;
    }
  }

  // Method to check SMS balance (Fast2SMS)
  async checkBalance(): Promise<any> {
    if (!this.fast2smsApiKey) {
      return { error: 'API key not configured' };
    }

    try {
      const response = await axios.get('https://www.fast2sms.com/dev/wallet', {
        headers: {
          'authorization': this.fast2smsApiKey
        }
      });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to check SMS balance:', error.response?.data || error.message);
      return { error: error.message };
    }
  }
}