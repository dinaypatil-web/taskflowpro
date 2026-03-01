import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsArray,
  IsBoolean,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class UpdateStakeholderDto {
  @ApiProperty({ example: 'John', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName?: string;

  @ApiProperty({ example: ['john.doe@company.com'], required: false })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  emails?: string[];

  @ApiProperty({ example: ['+1234567890'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Matches(/^\+[1-9]\d{1,14}$/, { each: true, message: 'Phone must be in E.164 format' })
  phones?: string[];

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

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}