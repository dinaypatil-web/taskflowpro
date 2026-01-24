import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StakeholdersService } from './stakeholders.service';
import { CreateStakeholderDto } from './dto/create-stakeholder.dto';
import { UpdateStakeholderDto } from './dto/update-stakeholder.dto';
import { StakeholderQueryDto } from './dto/stakeholder-query.dto';

@ApiTags('Stakeholders')
@Controller('stakeholders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StakeholdersController {
  constructor(private readonly stakeholdersService: StakeholdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new stakeholder' })
  @ApiResponse({ status: 201, description: 'Stakeholder created successfully' })
  create(@Request() req, @Body() createStakeholderDto: CreateStakeholderDto) {
    return this.stakeholdersService.create(req.user.id, createStakeholderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all stakeholders with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Stakeholders retrieved successfully' })
  findAll(@Request() req, @Query() query: StakeholderQueryDto) {
    return this.stakeholdersService.findAll(req.user.id, query);
  }

  @Get('tags')
  @ApiOperation({ summary: 'Get all unique tags' })
  @ApiResponse({ status: 200, description: 'Tags retrieved successfully' })
  getAllTags(@Request() req) {
    return this.stakeholdersService.getAllTags(req.user.id);
  }

  @Get('organizations')
  @ApiOperation({ summary: 'Get all unique organizations' })
  @ApiResponse({ status: 200, description: 'Organizations retrieved successfully' })
  getOrganizations(@Request() req) {
    return this.stakeholdersService.getOrganizations(req.user.id);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search stakeholders by contact info' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  searchByContact(@Request() req, @Query('contact') contact: string) {
    return this.stakeholdersService.searchByContact(req.user.id, contact);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific stakeholder' })
  @ApiResponse({ status: 200, description: 'Stakeholder retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Stakeholder not found' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.stakeholdersService.findOne(req.user.id, id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get stakeholder statistics' })
  @ApiResponse({ status: 200, description: 'Stakeholder statistics retrieved successfully' })
  getStats(@Request() req, @Param('id') id: string) {
    return this.stakeholdersService.getStakeholderStats(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a stakeholder' })
  @ApiResponse({ status: 200, description: 'Stakeholder updated successfully' })
  @ApiResponse({ status: 404, description: 'Stakeholder not found' })
  update(@Request() req, @Param('id') id: string, @Body() updateStakeholderDto: UpdateStakeholderDto) {
    return this.stakeholdersService.update(req.user.id, id, updateStakeholderDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a stakeholder' })
  @ApiResponse({ status: 200, description: 'Stakeholder deleted successfully' })
  @ApiResponse({ status: 404, description: 'Stakeholder not found' })
  remove(@Request() req, @Param('id') id: string) {
    return this.stakeholdersService.remove(req.user.id, id);
  }
}