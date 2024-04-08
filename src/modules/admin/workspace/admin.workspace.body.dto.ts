import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEmail, IsEnum, IsNumber, ValidateNested } from 'class-validator';
import { CouponType } from '../../../entities/coupon.entity';
import { PolicyPermission } from '../../../entities/workspace.admin.entity';

export class RevokeInvitationBody {
  @ApiProperty()
  @IsEmail()
  email: string;
}

export class BlockUserBody {
  @ApiProperty()
  workspaceId: number;

  @ApiProperty()
  workspaceUserId: number;
}

export class InvitationBody extends RevokeInvitationBody {
  @ApiProperty({ enum: PolicyPermission })
  @IsEnum(PolicyPermission)
  permission: PolicyPermission;
}

class RequestWorkspaceData {
  @ApiProperty()
  @IsNumber()
  requestId: number;

  @ApiProperty()
  @IsBoolean()
  approved: boolean;
}

export class AcceptRequestBody {
  @ApiProperty({ type: RequestWorkspaceData, isArray: true })
  @Type(() => RequestWorkspaceData)
  @IsArray()
  @ValidateNested()
  data: RequestWorkspaceData[];
}

export class CouponData {
  @ApiProperty()
  code: string;

  @ApiProperty({ enum: CouponType })
  type: CouponType;

  @ApiPropertyOptional()
  userId?: number;

  @ApiPropertyOptional()
  beginAt?: Date;

  @ApiPropertyOptional()
  endAt?: Date;
}

export class CouponDataForPublish {
  @ApiProperty()
  workspaceId: number;

  @ApiProperty({ isArray: true, type: CouponData })
  data: CouponData[];
}
