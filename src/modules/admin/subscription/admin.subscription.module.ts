import { Module } from '@nestjs/common';
import { SubscriptionModule } from '../../subscription/subscription.module';
import { AdminSubscriptionController } from './admin.subscription.controller';

@Module({
  imports: [SubscriptionModule],
  controllers: [AdminSubscriptionController],
})
export class AdminSubscriptionModule {}
