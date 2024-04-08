import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payments } from '../../entities/payment.entity';
import { PaymentService } from './payment.service';

@Module({
  imports: [TypeOrmModule.forFeature([Payments])],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
