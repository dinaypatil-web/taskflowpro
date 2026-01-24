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

export class UpdateCalendarEventDto {
  @ApiProperty({ example: 'Updated Project Meeting', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiProperty({ 
    example: 'Updated meeting description', 
    required: false 
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: '2024-02-15T10:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ example: '2024-02-15T11:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @ApiProperty({ example: 'Conference Room B', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiProperty({ 
    example: 'task-id-456', 
    required: false,
    description: 'Link this event to a different task'
  })
  @IsOptional()
  @IsUUID()
  taskId?: string;
}