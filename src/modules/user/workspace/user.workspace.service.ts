import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { Users } from '../../../entities/user.entity';
import { Workspaces } from '../../../entities/workspace.entity';
import { WorkspaceUsers } from '../../../entities/workspace.user.entity';

@Injectable()
export class UserWorkspaceService {
  constructor(
    @InjectRepository(Users) private readonly userRepository: Repository<Users>,
    @InjectRepository(Workspaces) private readonly workspaceRepository: Repository<Workspaces>,
    @InjectRepository(WorkspaceUsers) private readonly workspaceUsersRepository: Repository<WorkspaceUsers>,
  ) {}

  async findWorkspaceAdmins(condition: FindOptionsWhere<Omit<WorkspaceUsers, 'valid'>>) {
    return this.workspaceUsersRepository.findOneBy({ ...condition, valid: true });
  }

  async getWorkspaceUser(userId: number, workspaceId: number) {
    const result = await this.findWorkspaceAdmins({ userId, workspaceId });
    if (!result) throw new BadRequestException('해당 스페이스의 사용자가 없습니다');
    return result;
  }

  async getWorkspaces(userId: number) {
    return this.workspaceUsersRepository.find({
      select: { id: true, name: true, workspaceOrderOfUser: true, valid: true, workspace: { id: true, name: true } },
      relations: ['workspace'],
      where: { userId, valid: true },
      order: { workspaceOrderOfUser: 'ASC' },
    });
  }

  async joinWorkspace(userId: number, workspaceId: number) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new BadRequestException('존재하지 않는 사용자입니다');

    const workspace = await this.workspaceRepository.countBy({ id: workspaceId });
    if (!workspace) throw new BadRequestException('존재하지 않는 워크스페이스입니다');

    const existCheck = await this.workspaceUsersRepository.findOne({
      select: { id: true, valid: true, validByAdmin: true },
      where: { userId, workspaceId },
    });
    if (existCheck) {
      if (existCheck.valid) throw new BadRequestException('이미 가입된 워크스페이스입니다');
      if (!existCheck.validByAdmin) throw new BadRequestException('관리자에 의해 차단된 사용자입니다');
    }

    const workspaces = await this.getWorkspaces(userId);
    let order: bigint | undefined;
    if (workspaces.length) order = BigInt(workspaces[workspaces.length - 1].workspaceOrderOfUser) + 50000n;

    if (existCheck)
      return this.workspaceUsersRepository.update(existCheck.id, {
        validByUser: true,
        workspaceOrderOfUser: order?.toString(),
      });
    else
      return this.workspaceUsersRepository.save({
        userId,
        workspaceId,
        name: user.email.split('@')[0],
        workspaceOrderOfUser: order?.toString(),
      });
  }

  async leaveWorkspace(workspaceUserId: number) {
    const existCheck = await this.workspaceUsersRepository.findOneBy({ id: workspaceUserId });
    if (!existCheck) throw new BadRequestException('가입되지 않은 워크스페이스입니다');

    return this.workspaceUsersRepository.update(existCheck.id, { validByUser: false });
  }

  private async reorderAllWorkspaceUser(userId: number) {
    const workspaceUsers = await this.workspaceUsersRepository.find({
      where: { userId, valid: true },
      order: { workspaceOrderOfUser: 'ASC' },
    });
    let initialOrder = 50000n;
    for (const workspaceUser of workspaceUsers) {
      await this.workspaceUsersRepository.update(workspaceUser.id, { workspaceOrderOfUser: initialOrder.toString() });
      initialOrder += 10000n;
    }
  }

  /**
   * This function has recursive calls which can be called infinitely.
   * @param data
   * @returns
   */
  async reorderWorkspaceUser(data: {
    userId: number;
    headWorkspaceUserId: number;
    tailWorkspaceUserId: number;
    targetWorkspaceUserId: number;
  }): Promise<void> {
    const targetWorkspaceUsers = await this.workspaceUsersRepository.find({
      select: ['id', 'workspaceOrderOfUser'],
      where: { id: In([data.headWorkspaceUserId, data.tailWorkspaceUserId, data.targetWorkspaceUserId]) },
    });

    const headWorkspaceUser = targetWorkspaceUsers.find((user) => user.id === data.headWorkspaceUserId);
    const tailWorkspaceUser = targetWorkspaceUsers.find((user) => user.id === data.tailWorkspaceUserId);
    const targetWorkspaceUser = targetWorkspaceUsers.find((user) => user.id === data.targetWorkspaceUserId);

    if (!headWorkspaceUser || !tailWorkspaceUser || !targetWorkspaceUser)
      throw new BadRequestException('존재하지 유저 워크스페이스입니다');

    const headOrder = BigInt(headWorkspaceUser.workspaceOrderOfUser);
    const tailOrder = BigInt(tailWorkspaceUser.workspaceOrderOfUser);
    if (headOrder - tailOrder === 1n) {
      await this.reorderAllWorkspaceUser(data.userId);
      return this.reorderWorkspaceUser(data);
    }

    const targetOrder = (headOrder + tailOrder) / 2n;
    await this.workspaceUsersRepository.update(targetWorkspaceUser.id, {
      workspaceOrderOfUser: targetOrder.toString(),
    });
  }
}
