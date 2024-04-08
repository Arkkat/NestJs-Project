import { Body, Controller, Delete, Get, HttpStatus, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { GetWorkspaceAdminToken, WorkspaceAdminGuard, WorkspaceAdminToken } from '../../../decorators/admin.decorator';
import { AcceptRequestBody, BlockUserBody, InvitationBody, RevokeInvitationBody } from './admin.workspace.body.dto';
import { WorkspaceUserQuery } from './admin.workspace.query.dto';
import { InvitationResponse, JoinRequestResponse, WorkspaceUsers } from './admin.workspace.response.dto';
import { AdminWorkspaceService } from './admin.workspace.service';

@ApiTags('admin')
@Controller({ path: 'admin/workspace', version: '1' })
@UseGuards(WorkspaceAdminGuard)
export class AdminWorkspaceController {
  constructor(private readonly adminService: AdminWorkspaceService) {}

  @ApiBearerAuth('admin/workspace')
  @ApiOkResponse({ type: [JoinRequestResponse] })
  @Get('join/request')
  async getJoinRequestWorkspace(@GetWorkspaceAdminToken() admin: WorkspaceAdminToken) {
    return this.adminService.getWorkspaceJoinRequests(admin.workspaceAdminId);
  }

  @ApiBearerAuth('admin/workspace')
  @ApiOkResponse({ description: `${HttpStatus.OK} Code Only` })
  @Put('join/accept')
  async acceptRequestWorkspace(@GetWorkspaceAdminToken() admin: WorkspaceAdminToken, @Body() body: AcceptRequestBody) {
    return this.adminService.acceptRequestWorkspace(admin.workspaceAdminId, body.data);
  }

  @ApiBearerAuth('admin/workspace')
  @ApiCreatedResponse({ description: `${HttpStatus.CREATED} Code Only` })
  @Post('invitation')
  async inviteWorkspace(@GetWorkspaceAdminToken() admin: WorkspaceAdminToken, @Body() body: InvitationBody) {
    await this.adminService.inviteWorkspace(admin.workspaceAdminId, body);
  }

  @ApiBearerAuth('admin/workspace')
  @ApiOkResponse({ type: InvitationResponse })
  @Get('invitation')
  async getInvitationWorkspace(@GetWorkspaceAdminToken() admin: WorkspaceAdminToken) {
    return this.adminService.getInvitationWorkspace(admin.workspaceAdminId);
  }

  @ApiBearerAuth('admin/workspace')
  @ApiOkResponse({ description: `${HttpStatus.OK} Code Only` })
  @Delete('invitation')
  async revokeInvitation(@GetWorkspaceAdminToken() admin: WorkspaceAdminToken, @Body() body: RevokeInvitationBody) {
    await this.adminService.revokeInvitation(admin.workspaceAdminId, body);
  }

  @ApiBearerAuth('admin/workspace')
  @ApiOkResponse({ type: [WorkspaceUsers] })
  @Get('user')
  async getUserList(@GetWorkspaceAdminToken() admin: WorkspaceAdminToken, @Query() query: WorkspaceUserQuery) {
    await this.adminService.getUserList(admin.workspaceAdminId, query.workspaceUserId);
  }

  @ApiBearerAuth('admin/workspace')
  @ApiOkResponse({ description: `${HttpStatus.OK} Code Only` })
  @Put('block-user')
  async blockUser(@GetWorkspaceAdminToken() admin: WorkspaceAdminToken, @Body() body: BlockUserBody) {
    await this.adminService.blockUser({
      workspaceAdminId: admin.workspaceAdminId,
      workspaceUserId: body.workspaceUserId,
    });
  }

  @ApiBearerAuth('admin/workspace')
  @ApiOkResponse({ description: `${HttpStatus.OK} Code Only` })
  @Put('unblock-user')
  async unblockUser(@GetWorkspaceAdminToken() admin: WorkspaceAdminToken, @Body() body: BlockUserBody) {
    await this.adminService.unblockUser({
      workspaceAdminId: admin.workspaceAdminId,
      workspaceUserId: body.workspaceUserId,
    });
  }
}
