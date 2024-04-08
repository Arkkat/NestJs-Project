import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscriptions, UserSubscriptionHistory, UserSubscriptions } from '../../entities/subscription.entity';
import { AdminWorkspaceModule } from '../admin/workspace/admin.workspace.module';
import { PaymentModule } from '../payment/payment.module';
import { SubscriptionService } from './subscription.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscriptions, UserSubscriptions, UserSubscriptionHistory]),
    AdminWorkspaceModule,
    PaymentModule,
  ],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
