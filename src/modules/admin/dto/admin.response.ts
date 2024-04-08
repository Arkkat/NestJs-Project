import { ApiProperty } from '@nestjs/swagger';
import { DetailedPermission, PolicyPermission, WorkspaceAdmins } from '../../../entities/workspace.admin.entity';
import { Workspaces } from '../../../entities/workspace.entity';

export class AdminWorkspaces
  implements Pick<WorkspaceAdmins, 'id' | 'globalPermission' | 'grantedPermission' | 'name'>
{
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  globalPermission: PolicyPermission;

  @ApiProperty()
  grantedPermission: DetailedPermission[];

  @ApiProperty()
  workspace: Pick<Workspaces, 'id' | 'name'>;
}

export class SignInDefaultResponse {
  @ApiProperty()
  authorization: string;

  @ApiProperty()
  workspaces: AdminWorkspaces[];
}
