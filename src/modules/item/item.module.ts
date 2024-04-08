import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GrantedHistory, Items, UsedHistory, UserItems } from '../../entities/item.entity';
import { Payments } from '../../entities/payment.entity';
import { WorkspaceUsers } from '../../entities/workspace.user.entity';
import { AdminWorkspaceModule } from '../admin/workspace/admin.workspace.module';
import { PaymentModule } from '../payment/payment.module';
import { UserWorkspaceModule } from '../user/workspace/user.workspace.module';
import { ItemService } from './item.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payments, Items, UserItems, GrantedHistory, UsedHistory, WorkspaceUsers]),
    PaymentModule,
    AdminWorkspaceModule,
    UserWorkspaceModule,
  ],
  providers: [ItemService],
  exports: [ItemService],
})
export class ItemModule {}
