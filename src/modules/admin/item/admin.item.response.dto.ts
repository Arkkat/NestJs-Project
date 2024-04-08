import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GrantedHistory, UserItems } from 'src/entities/item.entity';
import { Payments } from 'src/entities/payment.entity';

export class ItemResponse {
  @ApiProperty()
  id: number;
  @ApiProperty()
  type: string;
  @ApiProperty()
  workspaceId: number;
  @ApiProperty()
  valid: boolean;
}

export class GrantHistoryResponse {
  @ApiProperty()
  id: number;
  @ApiProperty()
  userItemId: number;
  @ApiProperty()
  amount: number;
  @ApiPropertyOptional()
  paymentId: number;
  @ApiProperty()
  beginAt: Date;
  @ApiPropertyOptional()
  endAt: Date;
  @ApiProperty()
  createdAt: Date;
  @ApiPropertyOptional()
  revokedAt: Date;
}
