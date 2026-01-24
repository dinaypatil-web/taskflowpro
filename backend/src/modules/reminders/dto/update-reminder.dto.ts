import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
  MaxLength,
} from 'class-validator';

export class UpdateReminderDto {
  @ApiProperty({ example: 'TASK_DUE', required: false })
  @IsOptional()
  @IsEnum(['TASK_DUE', 'TASK_OVERDUE', 'TASK_ASSIGNED', 'CUSTOM'])
  type?: 'TASK_DUE' | 'TASK_OVERDUE' | 'TASK_ASSIGNED' | 'CUSTOM';

  @ApiProperty({ example: '2024-02-15T09:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiProperty({ 
    example: 'Updated reminder message', 
    required: false,
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiProperty({ 
    example: 'weekly', 
    required: false,
    description: 'Recurring pattern (e.g., daily, weekly, monthly)'
  })
  @IsOptional()
  @IsString()
  recurringPattern?: string;
}