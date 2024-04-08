import { Body, Controller, Delete, Get, HttpStatus, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { WorkspaceAdminGuard, WorkspaceAdminToken, GetWorkspaceAdminToken } from '../../../decorators/admin.decorator';
import { GrantedHistory, Items } from '../../../entities/item.entity';
import { ItemService } from '../../item/item.service';
import { CreateItemBody, ChangeItemBody, GiveItemBody, GrantedItemBody } from './admin.item.body.dto';
import { GrantedItemQuery } from './admin.item.query.dto';
import { GrantHistoryResponse, ItemResponse } from './admin.item.response.dto';

@ApiTags('admin')
@Controller({ path: 'admin/item', version: '1' })
@UseGuards(WorkspaceAdminGuard)
export class AdminItemController {
  constructor(private readonly itemService: ItemService) {}

  @ApiBearerAuth('admin/workspace')
  @ApiCreatedResponse({ description: `${HttpStatus.CREATED} Code Only` })
  @Post()
  async createItem(@GetWorkspaceAdminToken() admin: WorkspaceAdminToken, @Body() body: CreateItemBody) {
    await this.itemService.createItem({
      ...body,
      workspaceAdminId: admin.workspaceAdminId,
    });
  }

  @ApiBearerAuth('admin/workspace')
  @ApiOkResponse({ description: `${HttpStatus.OK} Code Only` })
  @Put()
  async changeItem(@GetWorkspaceAdminToken() admin: WorkspaceAdminToken, @Body() body: ChangeItemBody) {
    await this.itemService.changeItem({ ...body, workspaceAdminId: admin.workspaceAdminId });
  }

  @ApiBearerAuth('admin/workspace')
  @ApiOkResponse({ type: [ItemResponse] })
  @Get()
  async getItems(@GetWorkspaceAdminToken() admin: WorkspaceAdminToken) {
    return this.itemService.getItems(admin.workspaceAdminId);
  }

  @ApiBearerAuth('admin/workspace')
  @ApiOkResponse({ description: `${HttpStatus.OK} Code Only` })
  @Put('grant')
  async grantItem(@GetWorkspaceAdminToken() admin: WorkspaceAdminToken, @Body() body: GiveItemBody) {
    await this.itemService.grantItem({ workspaceAdminId: admin.workspaceAdminId, ...body });
  }

  @ApiBearerAuth('admin/workspace')
  @ApiOkResponse({ type: [GrantHistoryResponse] })
  @Get('grant/history')
  async getGrantedHistory(@GetWorkspaceAdminToken() admin: WorkspaceAdminToken, @Query() query: GrantedItemQuery) {
    return this.itemService.grantItemHistory({ workspaceAdminId: admin.workspaceAdminId, ...query });
  }

  @ApiBearerAuth('admin/workspace')
  @ApiOkResponse({ description: `${HttpStatus.OK} Code Only` })
  @Delete('grant/history')
  async deleteGrantedHistory(@GetWorkspaceAdminToken() admin: WorkspaceAdminToken, @Body() body: GrantedItemBody) {
    await this.itemService.deleteGrantedHistory({ workspaceAdminId: admin.workspaceAdminId, ...body });
  }
}
