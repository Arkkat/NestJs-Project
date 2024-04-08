import { Body, Controller, Delete, Get, HttpStatus, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { WorkspaceIdQuery } from '../../../common/common.query.dto';
import { GetWorkspaceAdminToken, WorkspaceAdminGuard, WorkspaceAdminToken } from '../../../decorators/admin.decorator';
import { Subscriptions } from '../../../entities/subscription.entity';
import { SubscriptionService } from '../../subscription/subscription.service';
import { CreateSubscription, SubscriptionBody } from './admin.subscription.body.dto';

@ApiTags('admin')
@Controller({ path: 'admin/subscription', version: '1' })
@UseGuards(WorkspaceAdminGuard)
export class AdminSubscriptionController {
  constructor(private readonly itemService: SubscriptionService) {}

  @ApiBearerAuth('admin/workspace')
  @ApiCreatedResponse({ description: `${HttpStatus.CREATED} Code Only` })
  @Post()
  async createSubscription(@GetWorkspaceAdminToken() admin: WorkspaceAdminToken, @Body() body: CreateSubscription) {
    await this.itemService.createSubscription({ workspaceAdminId: admin.workspaceAdminId, ...body });
  }

  @ApiBearerAuth('admin/workspace')
  @ApiOkResponse({ type: Subscriptions, isArray: true })
  @Get()
  async getSubscriptions(@GetWorkspaceAdminToken() admin: WorkspaceAdminToken, @Query() query: WorkspaceIdQuery) {
    return this.itemService.getSubscription({ workspaceAdminId: admin.workspaceAdminId, ...query });
  }

  @ApiBearerAuth('admin/workspace')
  @ApiOkResponse({ type: Subscriptions, isArray: true })
  @Delete()
  async deleteSubscription(@GetWorkspaceAdminToken() admin: WorkspaceAdminToken, @Body() body: SubscriptionBody) {
    return this.itemService.softDeleteSubscription({ workspaceAdminId: admin.workspaceAdminId, ...body });
  }

  @ApiBearerAuth('admin/workspace')
  @ApiOkResponse({ type: Subscriptions, isArray: true })
  @Put('active')
  async activeSubscription(@GetWorkspaceAdminToken() admin: WorkspaceAdminToken, @Query() body: SubscriptionBody) {
    return this.itemService.activeSubscription({ workspaceAdminId: admin.workspaceAdminId, ...body });
  }

  @ApiBearerAuth('admin/workspace')
  @ApiOkResponse({ type: Subscriptions, isArray: true })
  @Put('inactive')
  async inactiveSubscription(@GetWorkspaceAdminToken() admin: WorkspaceAdminToken, @Query() body: SubscriptionBody) {
    return this.itemService.inactiveSubscription({ workspaceAdminId: admin.workspaceAdminId, ...body });
  }
}
