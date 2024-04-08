import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admins } from '../../../entities/admin.entity';
import { Coupons } from '../../../entities/coupon.entity';
import {
  WorkspaceAdminInvitations,
  WorkspaceAdminRequests,
  WorkspaceAdmins,
} from '../../../entities/workspace.admin.entity';
import { Workspaces } from '../../../entities/workspace.entity';
import { WorkspaceUsers } from '../../../entities/workspace.user.entity';
import { AdminWorkspaceController } from './admin.workspace.controller';
import { AdminWorkspaceService } from './admin.workspace.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Admins,
      Coupons,
      WorkspaceUsers,
      Workspaces,
      WorkspaceAdmins,
      WorkspaceAdminInvitations,
      WorkspaceAdminRequests,
    ]),
  ],
  providers: [AdminWorkspaceService],
  controllers: [AdminWorkspaceController],
  exports: [AdminWorkspaceService],
})
export class AdminWorkspaceModule {}
