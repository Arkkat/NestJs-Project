import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsObject } from 'class-validator';
import { PaymentType } from '../entities/payment.entity';

export class PaymentValidationBody {
  @ApiProperty()
  @IsEnum(PaymentType)
  type: PaymentType;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsObject()
  info: Record<string, unknown>;
}
