import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { WorkspaceIdQuery } from '../../common/common.query.dto';
import { AccessTokenResponse } from '../../common/common.response.dto';
import { GetUserId, UserGuard } from '../../decorators/user.decorator';
import { JoinInBody, ReorderWorkspaceBody, SignInBody } from './dto/user.body';
import { UserSignInDefaultResponse } from './dto/user.response';
import { UserService } from './user.service';

@ApiTags('user')
@Controller({ path: 'user', version: '1' })
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiCreatedResponse({ description: `${HttpStatus.CREATED} Code Only` })
  @Post('sign-up')
  async signUpUser(@Body() body: SignInBody) {
    await this.userService.signUp(body);
  }

  @ApiOkResponse({ type: UserSignInDefaultResponse })
  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  async singInUser(@Body() body: SignInBody) {
    return this.userService.signIn(body);
  }

  @ApiBearerAuth('user')
  @ApiOkResponse({ type: AccessTokenResponse })
  @UseGuards(UserGuard)
  @Get('workspace-token')
  async getWorkspaceToken(@GetUserId() userId: number, @Query() query: WorkspaceIdQuery) {
    return this.userService.getWorkspaceUserToken(userId, query.workspaceId);
  }

  @ApiBearerAuth('user')
  @ApiCreatedResponse({ description: `${HttpStatus.CREATED} Code Only` })
  @UseGuards(UserGuard)
  @Post('workspace-join')
  async joinWorkspace(@GetUserId() userId: number, @Body() body: JoinInBody) {
    await this.userService.joinWorkspace(userId, body.workspaceId);
  }

  @ApiBearerAuth('user')
  @ApiOkResponse({ description: `${HttpStatus.OK} Code Only` })
  @UseGuards(UserGuard)
  @Put('workspace-reorder')
  async inviteWorkspace(@GetUserId() userId: number, @Body() body: ReorderWorkspaceBody) {
    await this.userService.reorderWorkspaceUser({ userId, ...body });
  }
}
