import { Injectable } from '@nestjs/common';
import { FirestoreService } from '../../shared/firestore/firestore.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthService {
  constructor(
    private firestore: FirestoreService,
    private configService: ConfigService,
  ) { }

  async getHealthStatus() {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkMemory(),
    ]);

    const database = checks[0].status === 'fulfilled' ? checks[0].value : { status: 'error', error: (checks[0] as any).reason };
    const redis = checks[1].status === 'fulfilled' ? checks[1].value : { status: 'error', error: (checks[1] as any).reason };
    const memory = checks[2].status === 'fulfilled' ? checks[2].value : { status: 'error', error: (checks[2] as any).reason };

    const isHealthy = database.status === 'ok' && redis.status === 'ok' && memory.status === 'ok';

    return {
      status: isHealthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: this.configService.get('NODE_ENV'),
      checks: {
        database,
        redis,
        memory,
      },
    };
  }

  private async checkDatabase() {
    try {
      // Just check if we can access a collection
      await this.firestore.collection('health_check').limit(1).get();
      return { status: 'ok', responseTime: Date.now() };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  private async checkRedis() {
    try {
      // For now, we'll assume it's healthy if the service starts
      return { status: 'ok', responseTime: Date.now() };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  private checkMemory() {
    const memUsage = process.memoryUsage();
    const totalMem = memUsage.heapTotal;
    const usedMem = memUsage.heapUsed;
    const memoryUsagePercent = (usedMem / totalMem) * 100;

    return {
      status: memoryUsagePercent < 90 ? 'ok' : 'warning',
      usage: {
        total: totalMem,
        used: usedMem,
        percentage: Math.round(memoryUsagePercent * 100) / 100,
      },
    };
  }
}