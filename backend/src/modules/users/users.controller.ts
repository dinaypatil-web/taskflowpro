import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  async getProfile(@Request() req) {
    return this.usersService.findById(req.user.id);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateProfile(req.user.id, updateUserDto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, description: 'User statistics retrieved successfully' })
  async getUserStats(@Request() req) {
    return this.usersService.getUserStats(req.user.id);
  }

  @Get('available-superiors')
  @ApiOperation({ summary: 'Get available superiors for organization' })
  @ApiResponse({ status: 200, description: 'Superiors retrieved successfully' })
  async getAvailableSuperiors(@Request() req) {
    // We could pass organization from query, but for now let's just use the current user's org if set
    const user = await this.usersService.findById(req.user.id);
    return this.usersService.getAvailableSuperiors(req.user.id, (user as any).organization);
  }

  @Get('available-assignees')
  @ApiOperation({ summary: 'Get available assignees based on hierarchy' })
  @ApiResponse({ status: 200, description: 'Assignees retrieved successfully' })
  async getAvailableAssignees(@Request() req) {
    return this.usersService.getAvailableAssignees(req.user.id);
  }

  @Get('subordinates')
  @ApiOperation({ summary: 'Get users reporting to current user' })
  @ApiResponse({ status: 200, description: 'Subordinates retrieved successfully' })
  async getSubordinates(@Request() req) {
    return this.usersService.getSubordinates(req.user.id);
  }

  @Delete('account')
  @ApiOperation({ summary: 'Deactivate user account' })
  @ApiResponse({ status: 200, description: 'Account deactivated successfully' })
  async deactivateAccount(@Request() req) {
    return this.usersService.deactivateAccount(req.user.id);
  }
}