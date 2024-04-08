import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDefined, IsInt, IsOptional, ValidateNested } from 'class-validator';
import { PaymentValidationBody } from '../../../common/common.body.dto';

export class ItemQuery {
  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  itemId?: number;
}

export class BuyItemBody {
  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  itemId: number;

  @ApiProperty()
  @IsDefined()
  @ValidateNested()
  paymentData: PaymentValidationBody;
}
