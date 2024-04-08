import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PaymentType, Payments } from '../../entities/payment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class PaymentService {
  private readonly logger: Logger = new Logger(PaymentService.name);
  constructor(@InjectRepository(Payments) private readonly paymentRepository: Repository<Payments>) {}

  private async validateTossPayment(info: Record<string, unknown>) {
    this.logger.log('Validation');
    this.logger.log(info);
    return Promise.resolve(true);
  }

  async validatePayment(type: PaymentType, info: Record<string, unknown>) {
    switch (type) {
      case PaymentType.TOSS:
        return this.validateTossPayment(info);
      default:
        throw new BadRequestException('지원하지 않는 결제 타입입니다');
    }
  }

  private async approveTossPayment(info: Record<string, unknown>) {
    this.logger.log('Approvement');
    this.logger.log(info);
    return Promise.resolve(true);
  }

  private async approvePayment(type: PaymentType, info: Record<string, unknown>) {
    switch (type) {
      case PaymentType.TOSS:
        return this.approveTossPayment(info);
      default:
        throw new BadRequestException('지원하지 않는 결제 타입입니다');
    }
  }

  async createPaymentTx(entity: EntityManager, type: PaymentType, amount: number, txInfo: Record<string, unknown>) {
    await this.approvePayment(type, txInfo);
    return entity.save(Payments, { type, amount, txInfo });
  }
}
