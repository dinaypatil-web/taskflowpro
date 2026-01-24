import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsString,
  IsInt,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class ReminderQueryDto {
  @ApiProperty({ required: false, default: 1, minimum: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({ example: 'PENDING', required: false })
  @IsOptional()
  @IsEnum(['PENDING', 'SENT', 'FAILED', 'CANCELLED'])
  status?: 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED';

  @ApiProperty({ example: 'TASK_DUE', required: false })
  @IsOptional()
  @IsEnum(['TASK_DUE', 'TASK_OVERDUE', 'TASK_ASSIGNED', 'CUSTOM'])
  type?: 'TASK_DUE' | 'TASK_OVERDUE' | 'TASK_ASSIGNED' | 'CUSTOM';

  @ApiProperty({ required: false, description: 'Filter by specific task ID' })
  @IsOptional()
  @IsUUID()
  taskId?: string;

  @ApiProperty({ 
    required: false, 
    default: 'scheduledAt',
    enum: ['scheduledAt', 'createdAt', 'updatedAt', 'type', 'status']
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'scheduledAt';

  @ApiProperty({ 
    required: false, 
    default: 'asc',
    enum: ['asc', 'desc']
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'asc';
}