import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { PaymentValidationBody } from '../../../common/common.body.dto';

export class SubscriptionBody {
  @ApiProperty()
  @IsNumber()
  subscriptionId: number;

  @ApiProperty()
  @IsOptional()
  @ValidateNested()
  paymentData?: PaymentValidationBody;
}
