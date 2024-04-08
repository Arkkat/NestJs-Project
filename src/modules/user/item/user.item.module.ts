import { Module } from '@nestjs/common';
import { ItemModule } from '../../item/item.module';
import { UserItemController } from './user.item.controller';

@Module({
  imports: [ItemModule],
  controllers: [UserItemController],
})
export class UserItemModule {}
