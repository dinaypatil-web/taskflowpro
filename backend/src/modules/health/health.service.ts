import { Injectable, Logger } from '@nestjs/common';
import { FirestoreService } from '../../shared/firestore/firestore.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private firestore: FirestoreService,
    private configService: ConfigService,
  ) { }

  async getHealthStatus() {
    const [database, memory] = await Promise.all([
      this.checkDatabase(),
      Promise.resolve(this.checkMemory()),
    ]);

    // Only Firestore is critical for the app to function
    const isHealthy = database.status === 'ok';

    return {
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: this.configService.get('NODE_ENV', 'development'),
      checks: {
        database,
        memory,
      },
    };
  }

  private async checkDatabase() {
    try {
      const start = Date.now();
      await this.firestore.collection('health_check').limit(1).get();
      return { status: 'ok', responseTime: Date.now() - start };
    } catch (error) {
      this.logger.warn(`Database health check failed: ${error.message}`);
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
