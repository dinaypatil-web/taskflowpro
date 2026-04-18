import { Module, forwardRef } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { WorkflowsModule } from '../workflows/workflows.module';

@Module({
  imports: [forwardRef(() => WorkflowsModule)],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}