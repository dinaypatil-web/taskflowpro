import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, { message: 'Phone must be in E.164 format' })
  phone?: string;

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

  @ApiProperty({ example: 'Google', required: false })
  @IsOptional()
  @IsString()
  organization?: string;

  @ApiProperty({ example: 'Project X', required: false })
  @IsOptional()
  @IsString()
  projectName?: string;

  @ApiProperty({ example: 'Engineering', required: false })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({ example: 'user-id-123', required: false })
  @IsOptional()
  @IsString()
  superiorId?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  isProjectHead?: boolean;
}