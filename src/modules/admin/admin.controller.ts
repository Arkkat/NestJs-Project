import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { WorkspaceIdQuery } from '../../common/common.query.dto';
import { AccessTokenResponse } from '../../common/common.response.dto';
import { AdminGuard, GetAdminId } from '../../decorators/admin.decorator';
import { AdminService } from './admin.service';
import { SignUpBody } from './dto/admin.body';
import { SignInDefaultResponse } from './dto/admin.response';

@ApiTags('admin')
@Controller({ path: 'admin', version: '1' })
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @ApiCreatedResponse({ description: `${HttpStatus.CREATED} Code Only` })
  @Post('sign-up')
  async signUpUser(@Body() body: SignUpBody) {
    await this.adminService.signUp(body);
  }

  @ApiOkResponse({ type: SignInDefaultResponse })
  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  async singInUser(@Body() body: SignUpBody): Promise<SignInDefaultResponse> {
    return this.adminService.signIn(body);
  }

  @ApiBearerAuth('admin')
  @ApiOkResponse({ type: AccessTokenResponse })
  @UseGuards(AdminGuard)
  @Get('workspace-token')
  async getWorkspaceToken(@GetAdminId() adminId: number, @Query() query: WorkspaceIdQuery) {
    return this.adminService.getWorkspaceAdminToken(adminId, query.workspaceId);
  }

  @ApiBearerAuth('admin')
  @ApiCreatedResponse({ description: `${HttpStatus.CREATED} Code Only` })
  @UseGuards(AdminGuard)
  @Post('join-in')
  async joinInWorkspace(@GetAdminId() admin: number, @Query() query: WorkspaceIdQuery) {
    await this.adminService.joinInWorkspace(admin, query.workspaceId);
  }
}
