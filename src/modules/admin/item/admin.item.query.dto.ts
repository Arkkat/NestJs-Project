import { ApiProperty } from '@nestjs/swagger';

export class GrantedItemQuery {
  @ApiProperty()
  workspaceUserId: number;

  @ApiProperty()
  itemId: number;
}
