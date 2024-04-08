import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { pbkdf2Sync } from 'crypto';
import { Repository } from 'typeorm';
import { UserToken, WorkspaceUserToken } from '../../decorators/user.decorator';
import { Users } from '../../entities/user.entity';
import { SignInBody } from './dto/user.body';
import { UserWorkspaceService } from './workspace/user.workspace.service';

@Injectable()
export class UserService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userWorkspaceService: UserWorkspaceService,
    @InjectRepository(Users) private readonly userRepository: Repository<Users>,
  ) {}

  async signUp(data: SignInBody) {
    const checkUser = await this.userRepository.countBy({ email: data.email });
    if (checkUser) throw new BadRequestException('이미 존재하는 사용자입니다');

    const hashedPassword = pbkdf2Sync(
      data.password,
      this.configService.getOrThrow('PASSWORD_SALT'),
      100000,
      64,
      'sha256',
    ).toString('hex');

    await this.userRepository.save({
      email: data.email,
      password: hashedPassword,
    });
  }

  async signIn(data: SignInBody) {
    const hashedPassword = pbkdf2Sync(
      data.password,
      this.configService.getOrThrow('PASSWORD_SALT'),
      100000,
      64,
      'sha256',
    ).toString('hex');

    const user = await this.userRepository.findOne({
      select: ['id'],
      where: { email: data.email, password: hashedPassword },
    });
    if (!user) throw new BadRequestException('사용자를 찾을 수 없습니다');

    const workspaces = await this.userWorkspaceService.getWorkspaces(user.id);

    const token: UserToken = { userId: user.id };
    return {
      authorization: this.jwtService.sign(token),
      workspaces,
    };
  }

  async getWorkspaceUserToken(userId: number, workspaceId: number) {
    const workspaceUser = await this.userWorkspaceService.findWorkspaceAdmins({ userId, workspaceId });
    if (!workspaceUser) throw new BadRequestException('해당 워크스페이스에 소속된 관리자가 아닙니다');

    const token: WorkspaceUserToken = { workspaceUserId: workspaceUser.id };
    return {
      authorization: this.jwtService.sign(token),
    };
  }

  async joinWorkspace(userId: number, workspaceId: number) {
    return this.userWorkspaceService.joinWorkspace(userId, workspaceId);
  }

  async reorderWorkspaceUser(data: {
    userId: number;
    headWorkspaceUserId: number;
    tailWorkspaceUserId: number;
    targetWorkspaceUserId: number;
  }) {
    return this.userWorkspaceService.reorderWorkspaceUser(data);
  }
}
