import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsDateString,
  IsUUID,
} from 'class-validator';

export class CalendarQueryDto {
  @ApiProperty({ 
    required: false, 
    example: '2024-02-01T00:00:00Z',
    description: 'Start date for filtering events'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ 
    required: false, 
    example: '2024-02-29T23:59:59Z',
    description: 'End date for filtering events'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ 
    required: false, 
    example: 'task-id-123',
    description: 'Filter events by specific task ID'
  })
  @IsOptional()
  @IsUUID()
  taskId?: string;
}