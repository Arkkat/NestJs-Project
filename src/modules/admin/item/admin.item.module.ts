import { Module } from '@nestjs/common';
import { ItemModule } from '../../item/item.module';
import { AdminItemController } from './admin.item.controller';

@Module({
  imports: [ItemModule],
  controllers: [AdminItemController],
})
export class AdminItemModule {}
