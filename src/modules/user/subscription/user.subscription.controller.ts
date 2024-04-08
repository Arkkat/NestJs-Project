import { Body, Controller, Get, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { GetWorkspaceUser, UserWorkspaceGuard, WorkspaceUserToken } from '../../../decorators/user.decorator';
import { SubscriptionService } from '../../subscription/subscription.service';
import { SubscriptionBody } from './user.subscription.body.dto';
import { UserSubscriptionQuery } from './user.subscription.query.dto';

@ApiTags('user')
@Controller({ path: 'user/subscription', version: '1' })
@UseGuards(UserWorkspaceGuard)
export class UserSubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @ApiBearerAuth('user/workspace')
  @ApiOkResponse()
  @Get()
  async getSubscription(@GetWorkspaceUser() user: WorkspaceUserToken) {
    return this.subscriptionService.getUserSubscription(user.workspaceUserId);
  }

  @ApiBearerAuth('user/workspace')
  @ApiCreatedResponse()
  @Post()
  async upsertSubscription(@GetWorkspaceUser() user: WorkspaceUserToken, @Body() body: SubscriptionBody) {
    return this.subscriptionService.upsertSubscription({
      workspaceUserId: user.workspaceUserId,
      subscriptionId: body.subscriptionId,
      paymentData: body.paymentData,
    });
  }

  @ApiBearerAuth('user/workspace')
  @ApiOkResponse()
  @Patch('suspend')
  async suspendSubscription(@GetWorkspaceUser() user: WorkspaceUserToken, @Query() query: UserSubscriptionQuery) {
    return this.subscriptionService.suspendSubscription(user.workspaceUserId, !!query.status);
  }
}
