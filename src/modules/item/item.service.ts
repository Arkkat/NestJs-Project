import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { PaymentValidationBody } from '../../common/common.body.dto';
import { GrantedHistory, Items, UsedHistory, UserItems } from '../../entities/item.entity';
import { Payments } from '../../entities/payment.entity';
import { WorkspaceUsers } from '../../entities/workspace.user.entity';
import { AdminWorkspaceService } from '../admin/workspace/admin.workspace.service';
import { PaymentService } from '../payment/payment.service';

export type CustomUserItems = Partial<Pick<UserItems, 'id' | 'remainAmount'>> & Pick<Items, 'type'>;

@Injectable()
export class ItemService {
  constructor(
    private readonly workspaceAdminService: AdminWorkspaceService,
    private readonly paymentService: PaymentService,
    @InjectRepository(Payments) private readonly paymentRepository: Repository<Payments>,
    @InjectRepository(WorkspaceUsers) private readonly workspaceUsersRepository: Repository<WorkspaceUsers>,
    @InjectRepository(Items) private readonly itemRepository: Repository<Items>,
    @InjectRepository(UserItems) private readonly userItemRepository: Repository<UserItems>,
    @InjectRepository(GrantedHistory) private readonly grantedHistoryRepository: Repository<GrantedHistory>,
    @InjectRepository(UsedHistory) private readonly usedHistoryRepository: Repository<UsedHistory>,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  private getUserItemQuery(workspaceUserId: number) {
    return this.itemRepository
      .createQueryBuilder('item')
      .select('item.type', 'type')
      .addSelect('userItem.id', 'id')
      .addSelect('userItem.remainAmount', 'remainAmount')
      .leftJoin(UserItems, 'userItem', 'userItem.itemId = item.id AND userItem.workspaceUserId = :workspaceUserId', {
        workspaceUserId,
      })
      .whereExists(
        this.workspaceUsersRepository
          .createQueryBuilder('workspaceUser')
          .where('item.workspaceId = workspaceUser.workspaceId')
          .andWhere('workspaceUser.id = :workspaceUserId', { workspaceUserId }),
      )
      .andWhere('item.valid = true');
  }

  async getUserItem(workspaceUserId: number, itemId: number) {
    return this.getUserItemQuery(workspaceUserId)
      .andWhere('userItem.itemId = :itemId', { itemId })
      .getRawOne<CustomUserItems>();
  }

  async getUserItems(workspaceUserId: number) {
    return this.getUserItemQuery(workspaceUserId).getRawMany<CustomUserItems>();
  }

  async getUserItemByWorkspaceUserId(
    workspaceUserId: number,
    itemId: number,
  ): Promise<Pick<UserItems, 'id' | 'remainAmount'>> {
    const item = await this.itemRepository.countBy({ id: itemId, valid: true });
    if (!item) throw new BadRequestException('존재하지 않는 아이템입니다');

    const userItem = await this.userItemRepository.findOne({
      select: ['id', 'remainAmount'],
      where: { workspaceUserId, itemId },
    });
    if (userItem) return userItem;

    const newItem = await this.userItemRepository.save({ workspaceUserId, itemId });
    return { id: newItem.id, remainAmount: newItem.remainAmount };
  }

  async createItem(data: { workspaceAdminId: number; type: string }) {
    const workspaceAdmin = await this.workspaceAdminService.getWorkspaceGrantedAdmin(data.workspaceAdminId);

    const sameTypeItem = await this.itemRepository.findOneBy({
      type: data.type,
      workspaceId: workspaceAdmin.workspaceId,
    });
    if (sameTypeItem) throw new BadRequestException('이미 존재하는 아이템입니다');

    await this.itemRepository.save({ type: data.type, workspaceId: workspaceAdmin.workspaceId });
  }

  async getItems(workspaceAdminId: number) {
    const result = await this.workspaceAdminService.findWorkspaceAdmins({ id: workspaceAdminId });
    if (!result) throw new BadRequestException('관리자가 아닙니다');
    return this.itemRepository.find({ where: { workspaceId: result.workspaceId, valid: true } });
  }

  async changeItem(data: { workspaceAdminId: number; itemId: number; valid: boolean }) {
    const workspaceAdmin = await this.workspaceAdminService.getWorkspaceGrantedAdmin(data.workspaceAdminId);

    const item = await this.itemRepository.findOneBy({
      id: data.itemId,
      workspaceId: workspaceAdmin.workspaceId,
    });
    if (!item) throw new BadRequestException('존재하지 않거나 이미 삭제된 아이템입니다');

    await this.itemRepository.update(item.id, { valid: data.valid });
  }

  async buyItem(data: { workspaceUserId: number; itemId: number; paymentData: PaymentValidationBody }) {
    const userItem = await this.getUserItemByWorkspaceUserId(data.workspaceUserId, data.itemId);

    // (TODO) Validation Payment Logic -- paymentTxId
    const validation = await this.paymentService.validatePayment(data.paymentData.type, data.paymentData.info);
    if (!validation) throw new BadRequestException('결제 정보가 올바르지 않습니다');
    // (TODO) Get Item Amount for Payment
    const grantedAmount = 100;

    await this.entityManager.transaction(async (manager) => {
      const payment = await this.paymentService.createPaymentTx(
        manager,
        data.paymentData.type,
        data.paymentData.amount,
        data.paymentData.info,
      );
      await manager.update(UserItems, { id: userItem.id }, { remainAmount: userItem.remainAmount + grantedAmount });
      await manager.save(GrantedHistory, {
        workspaceUserId: data.workspaceUserId,
        paymentId: payment.id,
        userItemId: userItem.id,
        amount: grantedAmount,
      });
    });
  }

  async grantItem(data: { workspaceAdminId: number; workspaceUserId: number; itemId: number; amount: number }) {
    await this.workspaceAdminService.getWorkspaceGrantedAdmin(data.workspaceAdminId);

    const userItem = await this.getUserItemByWorkspaceUserId(data.workspaceUserId, data.itemId);
    await this.entityManager.transaction(async (manager) => {
      await manager.update(UserItems, { id: userItem.id }, { remainAmount: userItem.remainAmount + data.amount });
      await manager.save(GrantedHistory, {
        workspaceUserId: data.workspaceUserId,
        userItemId: userItem.id,
        amount: data.amount,
      });
    });
  }

  async grantItemHistory(data: { workspaceAdminId: number; workspaceUserId: number; itemId: number }) {
    await this.workspaceAdminService.getWorkspaceGrantedAdmin(data.workspaceAdminId);

    const userItem = await this.getUserItemByWorkspaceUserId(data.workspaceUserId, data.itemId);

    return this.grantedHistoryRepository.find({ where: { userItemId: userItem.id } });
  }

  async deleteGrantedHistory(data: { workspaceAdminId: number; grantedItemHistoryId: number }) {
    await this.workspaceAdminService.getWorkspaceGrantedAdmin(data.workspaceAdminId);

    const grantedItem = await this.grantedHistoryRepository.findOne({
      relations: ['userItem'],
      where: { id: data.grantedItemHistoryId },
    });
    if (!grantedItem) throw new BadRequestException('존재하지 구매 기록입니다');

    await this.entityManager.transaction(async (manager) => {
      await manager.update(
        UserItems,
        { id: grantedItem.id },
        { remainAmount: Math.max(grantedItem.userItem.remainAmount - grantedItem.amount, 0) },
      );
      await manager.update(GrantedHistory, data.grantedItemHistoryId, { revokedAt: () => 'NOW()' });
    });
  }
}
