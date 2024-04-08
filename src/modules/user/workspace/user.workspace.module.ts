import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from '../../../entities/user.entity';
import { Workspaces } from '../../../entities/workspace.entity';
import { WorkspaceUsers } from '../../../entities/workspace.user.entity';
import { UserWorkspaceController } from './user.workspace.controller';
import { UserWorkspaceService } from './user.workspace.service';

@Module({
  imports: [TypeOrmModule.forFeature([Users, Workspaces, WorkspaceUsers])],
  controllers: [UserWorkspaceController],
  providers: [UserWorkspaceService],
  exports: [UserWorkspaceService],
})
export class UserWorkspaceModule {}
