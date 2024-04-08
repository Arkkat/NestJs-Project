import { Module } from '@nestjs/common';
import { SubscriptionModule } from '../../subscription/subscription.module';
import { UserSubscriptionController } from './user.subscription.controller';

@Module({
  imports: [SubscriptionModule],
  controllers: [UserSubscriptionController],
})
export class UserSubscriptionModule {}
