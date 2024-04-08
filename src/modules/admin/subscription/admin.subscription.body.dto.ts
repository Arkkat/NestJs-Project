import { ApiProperty } from '@nestjs/swagger';
import { RenewalType } from '../../../entities/subscription.entity';

export class CreateSubscription {
  @ApiProperty()
  name: string;

  @ApiProperty()
  type: RenewalType;
}

export class SubscriptionBody {
  @ApiProperty()
  subscriptionId: number;
}
