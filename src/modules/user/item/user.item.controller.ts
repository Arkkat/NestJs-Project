import { Body, Controller, Get, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiProperty, ApiTags } from '@nestjs/swagger';
import { GetWorkspaceUser, UserWorkspaceGuard, WorkspaceUserToken } from '../../../decorators/user.decorator';
import { CustomUserItems, ItemService } from '../../item/item.service';
import { BuyItemBody, ItemQuery } from './user.item.body.dto';

class GetUserItemResponse {
  @ApiProperty()
  id: number;
  @ApiProperty()
  remainAmount: number;
  @ApiProperty()
  type: string;
}

@ApiTags('user')
@Controller({ path: 'user/item', version: '1' })
@UseGuards(UserWorkspaceGuard)
export class UserItemController {
  constructor(private readonly itemService: ItemService) {}

  @ApiBearerAuth('user/workspace')
  @ApiOkResponse({ type: [GetUserItemResponse] })
  @Get()
  async getItemList(@GetWorkspaceUser() user: WorkspaceUserToken, @Query() query: ItemQuery) {
    if (query.itemId) return this.itemService.getUserItem(user.workspaceUserId, query.itemId);
    return this.itemService.getUserItems(user.workspaceUserId);
  }

  @ApiBearerAuth('user/workspace')
  @ApiCreatedResponse({ description: `${HttpStatus.CREATED} Code Only` })
  @Post('buy')
  async buy(@GetWorkspaceUser() user: WorkspaceUserToken, @Body() body: BuyItemBody) {
    await this.itemService.buyItem({ workspaceUserId: user.workspaceUserId, ...body });
  }
}
