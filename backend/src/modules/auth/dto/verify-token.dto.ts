import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class VerifyTokenDto {
  @ApiProperty({ example: 'abc123def456...' })
  @IsString()
  token: string;
}