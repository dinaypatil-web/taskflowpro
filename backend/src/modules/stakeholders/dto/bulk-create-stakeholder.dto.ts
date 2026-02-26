import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateStakeholderDto } from './create-stakeholder.dto';

export class BulkCreateStakeholderDto {
    @ApiProperty({ type: [CreateStakeholderDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateStakeholderDto)
    stakeholders: CreateStakeholderDto[];
}
