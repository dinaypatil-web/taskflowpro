import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsArray,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateStakeholderDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ example: 'john.doe@company.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, { message: 'Phone must be in E.164 format' })
  phone?: string;

  @ApiProperty({ example: 'Acme Corporation', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  organization?: string;

  @ApiProperty({ 
    example: ['client', 'vip', 'project-manager'], 
    required: false,
    description: 'Array of tags for categorizing the stakeholder'
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}