import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, createParamDecorator } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// Raw Admin Token
export type AdminToken = {
  adminId: number;
};

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ headers: { authorization?: string } } & Partial<AdminToken>>();
    const token = request.headers.authorization;
    if (!token) throw new UnauthorizedException();

    try {
      const payload = await this.jwtService.verifyAsync<AdminToken>(token.replace('Bearer ', ''));
      request.adminId = payload.adminId;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }
}

export const GetAdminId = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Partial<AdminToken>>();
  if (!request.adminId) throw new UnauthorizedException();
  return request.adminId;
});

// Admin Workspace Token
export type WorkspaceAdminToken = {
  workspaceAdminId: number;
};

@Injectable()
export class WorkspaceAdminGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{ headers: { authorization?: string } } & Partial<WorkspaceAdminToken>>();
    const token = request.headers.authorization;
    if (!token) throw new UnauthorizedException();

    try {
      const payload = await this.jwtService.verifyAsync<WorkspaceAdminToken>(token.replace('Bearer ', ''));
      request.workspaceAdminId = payload.workspaceAdminId;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }
}

export const GetWorkspaceAdminToken = createParamDecorator<unknown, ExecutionContext, WorkspaceAdminToken>(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Partial<WorkspaceAdminToken>>();
    if (!request.workspaceAdminId) throw new UnauthorizedException();
    return { workspaceAdminId: request.workspaceAdminId };
  },
);
