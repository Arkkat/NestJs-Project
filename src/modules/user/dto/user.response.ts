import { ApiProperty } from '@nestjs/swagger';

export class Workspace {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;
}

export class UserWorkspace {
  @ApiProperty()
  name: string;

  @ApiProperty()
  workspaceOrderOfUser: string;

  @ApiProperty()
  valid: boolean;

  @ApiProperty()
  workspace: Workspace;
}

export class UserSignInDefaultResponse {
  @ApiProperty()
  authorization: string;

  @ApiProperty({ type: [UserWorkspace] })
  workspaces: UserWorkspace[];
}
