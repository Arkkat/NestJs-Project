import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsString } from 'class-validator';

export class CreateItemBody {
  @ApiProperty()
  @IsString()
  type: string;
}

export class ChangeItemBody {
  @ApiProperty()
  @IsInt()
  itemId: number;

  @ApiProperty()
  @IsBoolean()
  valid: boolean;
}

export class GiveItemBody {
  @ApiProperty()
  @IsInt()
  workspaceUserId: number;

  @ApiProperty()
  @IsInt()
  itemId: number;

  @ApiProperty()
  @IsInt()
  amount: number;
}

export class GrantedItemBody {
  @ApiProperty()
  @IsInt()
  grantedItemHistoryId: number;
}
