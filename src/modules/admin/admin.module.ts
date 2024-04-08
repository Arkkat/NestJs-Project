import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admins } from '../../entities/admin.entity';
import { WorkspaceAdminInvitations } from '../../entities/workspace.admin.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminSubscriptionModule } from './subscription/admin.subscription.module';
import { AdminWorkspaceModule } from './workspace/admin.workspace.module';
import { AdminItemModule } from './item/admin.item.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admins, WorkspaceAdminInvitations]),
    AdminItemModule,
    AdminSubscriptionModule,
    AdminWorkspaceModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
