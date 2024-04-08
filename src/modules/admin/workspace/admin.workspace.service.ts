import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, FindOptionsWhere, Not, Repository } from 'typeorm';
import { Admins } from '../../../entities/admin.entity';
import { Coupons } from '../../../entities/coupon.entity';
import {
  PolicyPermission,
  WorkspaceAdminInvitations,
  WorkspaceAdminRequests,
  WorkspaceAdmins,
} from '../../../entities/workspace.admin.entity';
import { Workspaces } from '../../../entities/workspace.entity';
import { WorkspaceUsers } from '../../../entities/workspace.user.entity';
import { CouponData, InvitationBody, RevokeInvitationBody } from './admin.workspace.body.dto';

@Injectable()
export class AdminWorkspaceService {
  constructor(
    @InjectRepository(Admins) private readonly adminRepository: Repository<Admins>,
    @InjectRepository(Coupons) private readonly couponsRepository: Repository<Coupons>,
    @InjectRepository(WorkspaceAdminInvitations)
    private readonly workspaceAdminInvitationsRepository: Repository<WorkspaceAdminInvitations>,
    @InjectRepository(WorkspaceAdminRequests)
    private readonly workspaceAdminRequestsRepository: Repository<WorkspaceAdminRequests>,
    @InjectRepository(WorkspaceAdmins) private readonly workspaceAdminsRepository: Repository<WorkspaceAdmins>,
    @InjectRepository(Workspaces) private readonly workspaceRepository: Repository<Workspaces>,
    @InjectRepository(WorkspaceUsers) private readonly workspaceUsersRepository: Repository<WorkspaceUsers>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async findWorkspaceAdmins(condition: FindOptionsWhere<Omit<WorkspaceAdmins, 'valid'>>) {
    return this.workspaceAdminsRepository.findOneBy({ ...condition, valid: true });
  }

  async getWorkspaceGrantedAdmin(workspaceAdminId: number) {
    const result = await this.findWorkspaceAdmins({
      id: workspaceAdminId,
      globalPermission: Not(PolicyPermission.VIEWER),
    });
    if (!result) throw new BadRequestException('권한을 가진 관리자가 아닙니다');
    return result;
  }

  async getWorkspaces(adminId: number) {
    return this.workspaceAdminsRepository.find({
      select: {
        id: true,
        globalPermission: true,
        grantedPermission: true,
        name: true,
        workspace: {
          id: true,
          name: true,
        },
      },
      relations: { workspace: true },
      where: { adminId, valid: true },
    });
  }

  async joinInWorkspace(adminId: number, workspaceId: number) {
    const workspace = await this.workspaceRepository.countBy({ id: workspaceId });
    if (!workspace) throw new BadRequestException('존재하지 않는 워크스페이스입니다');

    const existCheck = await this.workspaceAdminsRepository.countBy({ adminId, workspaceId });
    if (existCheck) throw new BadRequestException('이미 가입된 이력이 있는 워크스페이스입니다');

    const existRequestCheck = await this.workspaceAdminRequestsRepository.countBy({
      adminId,
      workspaceId,
    });
    if (existRequestCheck) throw new BadRequestException('이미 가입 요청이 이루어진 적이 있는 워크스페이스입니다');

    return this.workspaceAdminRequestsRepository.save({
      adminId,
      workspaceId,
    });
  }

  async getWorkspaceJoinRequests(workspaceAdminId: number) {
    const checkWorkspaceAdmin = await this.findWorkspaceAdmins({
      id: workspaceAdminId,
      globalPermission: PolicyPermission.MASTER,
    });
    if (!checkWorkspaceAdmin) throw new BadRequestException('해당 워크스페이스의 마스터 권한이 필요합니다');

    return this.workspaceAdminRequestsRepository.findBy({
      workspaceId: checkWorkspaceAdmin.workspaceId,
      approved: false,
    });
  }

  async acceptRequestWorkspace(workspaceAdminId: number, data: { requestId: number; approved: boolean }[]) {
    const workspaceAdmin = await this.findWorkspaceAdmins({
      id: workspaceAdminId,
      globalPermission: PolicyPermission.MASTER,
    });
    if (!workspaceAdmin) throw new BadRequestException('해당 워크스페이스의 마스터 권한이 필요합니다');

    for (const request of data) {
      const requestInfo = await this.workspaceAdminRequestsRepository.findOne({
        relations: ['admin'],
        where: { id: request.requestId },
      });
      if (!requestInfo) continue;

      await this.entityManager.transaction(async (manager) => {
        await manager.update(WorkspaceAdminRequests, request.requestId, { approved: true });
        if (request.approved)
          await this.entityManager.save(WorkspaceAdmins, {
            adminId: requestInfo.adminId,
            workspaceId: workspaceAdmin.workspaceId,
            name: requestInfo.admin.email.split('@')[0],
            globalPermission: PolicyPermission.VIEWER,
            grantedPermission: [],
          });
      });
    }
  }

  async inviteWorkspace(workspaceAdminId: number, data: InvitationBody) {
    const workspaceAdmin = await this.findWorkspaceAdmins({
      id: workspaceAdminId,
      globalPermission: PolicyPermission.MASTER,
    });
    if (!workspaceAdmin) throw new BadRequestException('해당 워크스페이스의 마스터 권한이 필요합니다');

    const invitation = await this.workspaceAdminInvitationsRepository.findOneBy({
      email: data.email,
      workspaceId: workspaceAdmin.workspaceId,
      approved: false,
    });
    if (invitation) {
      await this.workspaceAdminInvitationsRepository.update(invitation.id, {
        permission: data.permission,
        valid: true,
      });
      return;
    }

    const invitee = await this.adminRepository.findOne({ select: ['id'], where: { email: data.email } });
    if (invitee) {
      const workspaceMember = await this.workspaceAdminsRepository.findOneBy({
        adminId: invitee.id,
        workspaceId: workspaceAdmin.workspaceId,
      });
      if (workspaceMember) throw new BadRequestException('이미 가입된 이력이 있는 사용자입니다');
    }

    await this.workspaceAdminInvitationsRepository.save({
      email: data.email,
      workspaceId: workspaceAdmin.workspaceId,
      permission: data.permission,
    });
  }

  async getInvitationWorkspace(workspaceAdminId: number) {
    const workspaceAdmin = await this.getWorkspaceGrantedAdmin(workspaceAdminId);
    return this.workspaceAdminInvitationsRepository.findBy({
      workspaceId: workspaceAdmin.workspaceId,
      approved: false,
      valid: true,
    });
  }

  async revokeInvitation(workspaceAdminId: number, data: RevokeInvitationBody) {
    const workspaceAdmin = await this.findWorkspaceAdmins({
      id: workspaceAdminId,
      globalPermission: PolicyPermission.MASTER,
    });
    if (!workspaceAdmin) throw new BadRequestException('해당 워크스페이스의 마스터 권한이 필요합니다');

    const invitation = await this.workspaceAdminInvitationsRepository.findOneBy({
      email: data.email,
      workspaceId: workspaceAdmin.workspaceId,
      valid: true,
    });
    if (invitation) await this.workspaceAdminInvitationsRepository.update(invitation.id, { valid: false });
  }

  async getUserList(workspaceAdminId: number, workspaceUserId?: number) {
    const workspaceAdmin = await this.getWorkspaceGrantedAdmin(workspaceAdminId);
    return this.workspaceUsersRepository.findBy({ workspaceId: workspaceAdmin.workspaceId, id: workspaceUserId });
  }

  async blockUser(data: { workspaceAdminId: number; workspaceUserId: number }) {
    await this.getWorkspaceGrantedAdmin(data.workspaceAdminId);
    const workspaceUser = await this.workspaceUsersRepository.countBy({ id: data.workspaceUserId });
    if (!workspaceUser) throw new BadRequestException('존재하지 않는 사용자입니다');

    await this.workspaceUsersRepository.update(data.workspaceUserId, { validByAdmin: false });
  }

  async unblockUser(data: { workspaceAdminId: number; workspaceUserId: number }) {
    await this.getWorkspaceGrantedAdmin(data.workspaceAdminId);
    const workspaceUser = await this.workspaceUsersRepository.findOne({
      select: { userId: true },
      where: { id: data.workspaceUserId },
    });
    if (!workspaceUser) throw new BadRequestException('존재하지 않는 사용자입니다');

    const lastOrder = (await this.workspaceUsersRepository.findOne({
      select: ['workspaceOrderOfUser'],
      where: { userId: workspaceUser.userId, valid: true },
      order: { workspaceOrderOfUser: 'DESC' },
    })) || { workspaceOrderOfUser: '0' };

    await this.workspaceUsersRepository.update(data.workspaceUserId, {
      validByAdmin: true,
      workspaceOrderOfUser: String(BigInt(lastOrder.workspaceOrderOfUser) + 50000n),
    });
  }

  async publishCoupons(data: { workspaceAdminId: number; workspaceId: number; data: CouponData[] }) {
    const workspaceAdmin = await this.getWorkspaceGrantedAdmin(data.workspaceAdminId);

    // bulk publish with validation of user existence is quite time-consuming.
    const failedCases: (CouponData & { reason: string })[] = [];
    for (const coupon of data.data) {
      const { userId, ...couponData } = coupon;
      if (userId) {
        const user = await this.workspaceUsersRepository.findOne({
          select: ['id'],
          where: { userId: coupon.userId, workspaceId: workspaceAdmin.workspaceId },
        });
        if (!user) {
          failedCases.push({ ...coupon, reason: '존재하지 않는 사용자' });
          continue;
        }

        await this.couponsRepository.save({ ...couponData, workspaceId: workspaceAdmin.workspaceId, userId: user.id });
      } else {
        await this.couponsRepository.save({ ...couponData, workspaceId: workspaceAdmin.workspaceId });
      }
    }
  }
}
