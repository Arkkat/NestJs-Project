import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDefined, IsOptional } from 'class-validator';

export class UserSubscriptionQuery {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDefined()
  status?: unknown;
}
