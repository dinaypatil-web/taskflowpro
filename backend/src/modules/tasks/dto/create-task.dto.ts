import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ example: 'Complete project proposal' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'Finish the Q1 project proposal and send to stakeholders', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: 'HIGH', required: false })
  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

  @ApiProperty({ example: '2024-02-15T10:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({
    example: ['stakeholder-id-1', 'stakeholder-id-2'],
    required: false,
    description: 'Array of stakeholder IDs to assign to this task'
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  stakeholderIds?: string[];
}