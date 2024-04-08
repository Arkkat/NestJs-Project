import { Controller, Delete, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { GetWorkspaceUser, UserWorkspaceGuard, WorkspaceUserToken } from '../../../decorators/user.decorator';
import { UserWorkspaceService } from './user.workspace.service';

@ApiTags('user')
@Controller({ path: 'user/workspace', version: '1' })
@UseGuards(UserWorkspaceGuard)
export class UserWorkspaceController {
  constructor(private readonly userService: UserWorkspaceService) {}

  @ApiBearerAuth('user/workspace')
  @ApiOkResponse({ description: `${HttpStatus.OK} Code Only` })
  @Delete('leave')
  async leaveWorkspace(@GetWorkspaceUser() user: WorkspaceUserToken) {
    await this.userService.leaveWorkspace(user.workspaceUserId);
  }
}
