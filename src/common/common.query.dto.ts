import { ApiProperty } from '@nestjs/swagger';

export class WorkspaceIdQuery {
  @ApiProperty()
  workspaceId: number;
}
