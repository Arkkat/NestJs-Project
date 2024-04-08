import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { PaymentValidationBody } from '../../common/common.body.dto';
import { Payments } from '../../entities/payment.entity';
import {
  RenewalType,
  Subscriptions,
  TxType,
  UserSubscriptionHistory,
  UserSubscriptions,
  renewSQL,
} from '../../entities/subscription.entity';
import { AdminWorkspaceService } from '../admin/workspace/admin.workspace.service';
import { PaymentService } from '../payment/payment.service';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly workspaceAdminService: AdminWorkspaceService,
    private readonly paymentService: PaymentService,
    @InjectRepository(Subscriptions) private readonly subscriptionRepository: Repository<Subscriptions>,
    @InjectRepository(UserSubscriptions) private readonly userSubscriptionRepository: Repository<UserSubscriptions>,
    @InjectRepository(UserSubscriptionHistory)
    private readonly userSubscriptionHistoryRepository: Repository<UserSubscriptionHistory>,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  async createSubscription(data: { workspaceAdminId: number; name: string; type: RenewalType }) {
    const admin = await this.workspaceAdminService.getWorkspaceGrantedAdmin(data.workspaceAdminId);
    if (!admin) throw new BadRequestException('관리자가 아닙니다');

    await this.subscriptionRepository.save({ name: data.name, type: data.type, workspaceId: admin.workspaceId });
  }

  async getSubscription(data: { workspaceAdminId: number }) {
    const admin = await this.workspaceAdminService.getWorkspaceGrantedAdmin(data.workspaceAdminId);
    if (!admin) throw new BadRequestException('관리자가 아닙니다');

    return this.subscriptionRepository.find({ where: { workspaceId: admin.workspaceId } });
  }

  async softDeleteSubscription(data: { workspaceAdminId: number; subscriptionId: number }) {
    const admin = await this.workspaceAdminService.getWorkspaceGrantedAdmin(data.workspaceAdminId);
    if (!admin) throw new BadRequestException('관리자가 아닙니다');

    const subscription = await this.subscriptionRepository.findOneBy({
      id: data.subscriptionId,
      workspaceId: admin.workspaceId,
    });
    if (!subscription) throw new BadRequestException('존재하지 않는 구독입니다');

    await this.subscriptionRepository.softDelete({ id: subscription.id });
  }

  async inactiveSubscription(data: { workspaceAdminId: number; subscriptionId: number }) {
    const admin = await this.workspaceAdminService.getWorkspaceGrantedAdmin(data.workspaceAdminId);
    if (!admin) throw new BadRequestException('관리자가 아닙니다');

    const subscription = await this.subscriptionRepository.findOneBy({
      id: data.subscriptionId,
      workspaceId: admin.workspaceId,
    });
    if (!subscription) throw new BadRequestException('존재하지 않는 구독입니다');

    await this.subscriptionRepository.update({ id: subscription.id }, { valid: false });
  }

  async activeSubscription(data: { workspaceAdminId: number; subscriptionId: number }) {
    const admin = await this.workspaceAdminService.getWorkspaceGrantedAdmin(data.workspaceAdminId);
    if (!admin) throw new BadRequestException('관리자가 아닙니다');

    const subscription = await this.subscriptionRepository.findOneBy({
      id: data.subscriptionId,
      workspaceId: admin.workspaceId,
    });
    if (!subscription) throw new BadRequestException('존재하지 않는 구독입니다');

    await this.subscriptionRepository.update({ id: subscription.id }, { valid: true });
  }

  private async startNewSubscription(subscription: Subscriptions, paymentData?: PaymentValidationBody) {
    if (subscription.paidPlan) {
      if (!paymentData) throw new BadRequestException('결제 정보가 필요합니다');
      const result = await this.paymentService.validatePayment(paymentData.type, paymentData.info);
      if (!result) throw new BadRequestException('결제 정보가 올바르지 않습니다');
    }

    return this.entityManager.transaction(async (manager) => {
      const userSubscription = await manager.save(
        UserSubscriptions,
        this.userSubscriptionRepository.create({
          currentSubscriptionId: subscription.id,
          nextSubscriptionId: subscription.automaticRenewal ? subscription.id : null,
          renewAt: renewSQL(subscription.renewalType),
        }),
      );
      let payment: Payments | undefined;
      if (paymentData) {
        payment = await this.paymentService.createPaymentTx(
          manager,
          paymentData.type,
          paymentData.amount,
          paymentData.info,
        );
      }
      await manager.save(
        UserSubscriptionHistory,
        this.userSubscriptionHistoryRepository.create({
          userSubscriptionId: userSubscription.id,
          txType: TxType.MANUAL,
          paymentId: payment?.id,
        }),
      );
    });
  }

  async upsertSubscription(data: {
    workspaceUserId: number;
    subscriptionId: number;
    paymentData?: PaymentValidationBody;
  }) {
    const subscription = await this.subscriptionRepository.findOneBy({ id: data.subscriptionId });
    if (!subscription) throw new BadRequestException('존재하지 않는 구독입니다');

    const userSubscription = await this.userSubscriptionRepository.findOneBy({
      workspaceUserId: data.workspaceUserId,
    });
    if (!userSubscription) return this.startNewSubscription(subscription, data.paymentData);

    // Update New Subscription
    if (userSubscription.renewAt < new Date())
      return this.userSubscriptionRepository.update(
        { id: userSubscription.id },
        { nextSubscriptionId: subscription.automaticRenewal ? subscription.id : null, suspended: false },
      );

    // Renewal Subscription
    if (subscription.paidPlan) {
      if (!data.paymentData) throw new BadRequestException('결제 정보가 필요합니다');
      const result = await this.paymentService.validatePayment(data.paymentData.type, data.paymentData.info);
      if (!result) throw new BadRequestException('결제 정보가 올바르지 않습니다');
    }

    return this.entityManager.transaction(async (manager) => {
      await manager.update(
        UserSubscriptions,
        { id: userSubscription.id },
        {
          currentSubscriptionId: subscription.id,
          nextSubscriptionId: subscription.automaticRenewal ? subscription.id : null,
          renewedAt: 'CURRENT_TIMESTAMP',
          renewAt: renewSQL(subscription.renewalType),
          suspended: false,
        },
      );
      let payment: Payments | undefined;
      if (data.paymentData) {
        payment = await this.paymentService.createPaymentTx(
          manager,
          data.paymentData.type,
          data.paymentData.amount,
          data.paymentData.info,
        );
      }
      await manager.save(
        UserSubscriptionHistory,
        this.userSubscriptionHistoryRepository.create({
          userSubscriptionId: userSubscription.id,
          txType: TxType.MANUAL,
          paymentId: payment?.id,
        }),
      );
    });
  }

  async getUserSubscription(workspaceUserId: number) {
    return this.userSubscriptionRepository.findOneBy({ workspaceUserId });
  }

  async suspendSubscription(workspaceUserId: number, status: boolean) {
    const userSubscription = await this.userSubscriptionRepository.findOneBy({ workspaceUserId });
    if (!userSubscription) throw new BadRequestException('구독이 존재하지 않습니다');

    return this.userSubscriptionRepository.update({ id: userSubscription.id }, { suspended: status });
  }
}
