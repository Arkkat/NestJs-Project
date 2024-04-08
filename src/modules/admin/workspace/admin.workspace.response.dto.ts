import { ApiProperty } from '@nestjs/swagger';
import { PolicyPermission } from '../../../entities/workspace.admin.entity';

export class JoinRequestResponse {
  @ApiProperty()
  id: number;
  @ApiProperty()
  workspaceId: number;
  @ApiProperty()
  adminId: number;
  @ApiProperty()
  approved: boolean;
}

export class InvitationResponse {
  @ApiProperty()
  id: number;
  @ApiProperty()
  workspaceId: number;
  @ApiProperty()
  email: string;
  @ApiProperty({ enum: PolicyPermission })
  permission: PolicyPermission;
  @ApiProperty()
  approved: boolean;
  @ApiProperty()
  valid: boolean;
}

export class WorkspaceUsers {
  @ApiProperty()
  id: number;
  @ApiProperty()
  workspaceId: number;
  @ApiProperty()
  userId: number;
  @ApiProperty()
  name: string;
  @ApiProperty()
  valid: boolean;
  @ApiProperty()
  validByUser: boolean;
  @ApiProperty()
  validByAdmin: boolean;
  @ApiProperty()
  workspaceOrderOfUser: string;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty({})
  workspaceUserId: number;
}
