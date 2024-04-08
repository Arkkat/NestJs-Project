import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { pbkdf2Sync } from 'crypto';
import { EntityManager, Repository } from 'typeorm';
import { AdminToken, WorkspaceAdminToken } from '../../decorators/admin.decorator';
import { Admins } from '../../entities/admin.entity';
import { PolicyPermission, WorkspaceAdminInvitations, WorkspaceAdmins } from '../../entities/workspace.admin.entity';
import { Workspaces } from '../../entities/workspace.entity';
import { SignUpBody } from './dto/admin.body';
import { AdminWorkspaceService } from './workspace/admin.workspace.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly adminWorkspaceService: AdminWorkspaceService,
    @InjectRepository(Admins) private readonly adminRepository: Repository<Admins>,
    @InjectRepository(WorkspaceAdminInvitations)
    private readonly workspaceAdminInvitationsRepository: Repository<WorkspaceAdminInvitations>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  private async joinInvitedWorkspace(email: string, adminId: number, defaultSpace = false) {
    // Prepare for the case where the admin has been invited to the workspace
    const invitations = await this.workspaceAdminInvitationsRepository.findBy({
      email: email,
      approved: false,
      valid: true,
    });
    const invitationIds = invitations.map((invitation) => invitation.id);

    if (invitationIds.length) {
      const memberInfo = invitations.map((invitation) => ({
        workspaceId: invitation.workspaceId,
        adminId: adminId,
        name: email.split('@')[0],
        globalPermission: invitation.permission,
        grantedPermission: [],
      }));
      await this.entityManager.transaction(async (manager) => {
        await manager.save(WorkspaceAdmins, memberInfo);
        await manager.update(WorkspaceAdminInvitations, invitationIds, { approved: true });
      });
    } else if (defaultSpace) {
      const defaultName = email.split('@')[0];
      await this.entityManager.transaction(async (manager) => {
        const defaultWorkspace = await manager.save(Workspaces, { name: `${defaultName}의 워크스페이스` });
        await manager.save(WorkspaceAdmins, {
          adminId: adminId,
          workspaceId: defaultWorkspace.id,
          globalPermission: PolicyPermission.MASTER,
          grantedPermission: [],
          name: defaultName,
        });
      });
    }
  }

  async signUp(data: SignUpBody) {
    const checkAdmin = await this.adminRepository.countBy({ email: data.email });
    if (checkAdmin) throw new BadRequestException('이미 존재하는 사용자입니다');

    const hashedPassword = pbkdf2Sync(
      data.password,
      this.configService.getOrThrow('PASSWORD_SALT'),
      100000,
      64,
      'sha256',
    ).toString('hex');

    const admin = await this.adminRepository.save({
      email: data.email,
      password: hashedPassword,
    });

    await this.joinInvitedWorkspace(data.email, admin.id, true);
  }

  async signIn(data: SignUpBody) {
    const hashedPassword = pbkdf2Sync(
      data.password,
      this.configService.getOrThrow('PASSWORD_SALT'),
      100000,
      64,
      'sha256',
    ).toString('hex');

    const admin = await this.adminRepository.findOne({
      select: ['id'],
      where: { email: data.email, password: hashedPassword },
    });
    if (!admin) throw new BadRequestException('사용자를 찾을 수 없습니다');

    await this.joinInvitedWorkspace(data.email, admin.id);

    const workspaces = await this.adminWorkspaceService.getWorkspaces(admin.id);

    const token: AdminToken = { adminId: admin.id };
    return {
      authorization: this.jwtService.sign(token),
      workspaces,
    };
  }

  async getWorkspaceAdminToken(adminId: number, workspaceId: number) {
    const workspaceAdmin = await this.adminWorkspaceService.findWorkspaceAdmins({ adminId, workspaceId });
    if (!workspaceAdmin) throw new BadRequestException('해당 워크스페이스에 소속된 관리자가 아닙니다');

    const token: WorkspaceAdminToken = { workspaceAdminId: workspaceAdmin.id };
    return {
      authorization: this.jwtService.sign(token),
    };
  }

  async joinInWorkspace(adminId: number, workspaceId: number) {
    return this.adminWorkspaceService.joinInWorkspace(adminId, workspaceId);
  }
}
