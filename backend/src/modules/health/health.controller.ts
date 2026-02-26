import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private healthService: HealthService) { }

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Health status (always 200 to avoid container restart loops)' })
  async getHealth() {
    // Always return 200 — health details are in the body.
    // Throwing 503 caused Docker HEALTHCHECK failures → Railway restart loops.
    return this.healthService.getHealthStatus();
  }
}
