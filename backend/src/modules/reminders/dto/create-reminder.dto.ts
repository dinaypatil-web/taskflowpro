import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateReminderDto {
  @ApiProperty({ example: 'task-id-123' })
  @IsUUID()
  taskId: string;

  @ApiProperty({ example: 'TASK_DUE' })
  @IsEnum(['TASK_DUE', 'TASK_OVERDUE', 'TASK_ASSIGNED', 'CUSTOM'])
  type: 'TASK_DUE' | 'TASK_OVERDUE' | 'TASK_ASSIGNED' | 'CUSTOM';

  @ApiProperty({ example: '2024-02-15T09:00:00Z' })
  @IsDateString()
  scheduledAt: string;

  @ApiProperty({ 
    example: 'Don\'t forget about the project deadline!', 
    required: false,
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiProperty({ 
    example: 'daily', 
    required: false,
    description: 'Recurring pattern (e.g., daily, weekly, monthly)'
  })
  @IsOptional()
  @IsString()
  recurringPattern?: string;
}