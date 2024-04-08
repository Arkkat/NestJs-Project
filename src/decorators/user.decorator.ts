import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, createParamDecorator } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// Raw User Token
export type UserToken = {
  userId: number;
};

@Injectable()
export class UserGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ headers: { authorization?: string } } & Partial<UserToken>>();
    const token = request.headers.authorization;
    if (!token) throw new UnauthorizedException();

    try {
      const payload = await this.jwtService.verifyAsync<UserToken>(token.replace('Bearer ', ''));
      request.userId = payload.userId;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }
}

export const GetUserId = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Partial<UserToken>>();
  if (!request.userId) throw new UnauthorizedException();
  return request.userId;
});

// User Workspace Token
export type WorkspaceUserToken = {
  workspaceUserId: number;
};

@Injectable()
export class UserWorkspaceGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{ headers: { authorization?: string } } & Partial<WorkspaceUserToken>>();
    const token = request.headers.authorization;
    if (!token) throw new UnauthorizedException();

    try {
      const payload = await this.jwtService.verifyAsync<WorkspaceUserToken>(token.replace('Bearer ', ''));
      request.workspaceUserId = payload.workspaceUserId;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }
}

export const GetWorkspaceUser = createParamDecorator<unknown, ExecutionContext, WorkspaceUserToken>(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Partial<WorkspaceUserToken>>();
    if (!request.workspaceUserId) throw new UnauthorizedException();
    return { workspaceUserId: request.workspaceUserId };
  },
);
