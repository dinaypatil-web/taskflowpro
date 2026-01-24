import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateCalendarEventDto {
  @ApiProperty({ example: 'Project Meeting' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiProperty({ 
    example: 'Discuss project progress and next steps', 
    required: false 
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: '2024-02-15T10:00:00Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-02-15T11:00:00Z' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @ApiProperty({ example: 'Conference Room A', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiProperty({ 
    example: 'task-id-123', 
    required: false,
    description: 'Link this event to a specific task'
  })
  @IsOptional()
  @IsUUID()
  taskId?: string;
}