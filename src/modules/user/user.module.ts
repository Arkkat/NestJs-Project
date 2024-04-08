import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from '../../entities/user.entity';
import { WorkspaceAdminInvitations, WorkspaceAdmins } from '../../entities/workspace.admin.entity';
import { Workspaces } from '../../entities/workspace.entity';
import { UserItemModule } from './item/user.item.module';
import { UserSubscriptionModule } from './subscription/user.subscription.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserWorkspaceModule } from './workspace/user.workspace.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Users, Workspaces, WorkspaceAdminInvitations, WorkspaceAdmins]),
    UserItemModule,
    UserSubscriptionModule,
    UserWorkspaceModule,
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
