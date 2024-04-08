import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Admins } from './admin.entity';
import { Workspaces } from './workspace.entity';

export enum PolicyPermission {
  MASTER = 'master',
  POWER_MODDERATOR = 'power-modderator',
  MODERATOR = 'moderator',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

export type DetailedPermission = { path: string; method: string };

@Entity()
export class WorkspaceAdmins {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @ManyToOne(() => Workspaces, (workspace) => workspace.id, { nullable: false })
  workspace: Workspaces;

  @Column({ unsigned: true })
  workspaceId: number;

  @ManyToOne(() => Admins, (admin) => admin.id, { nullable: false })
  admin: Admins;

  @Column({ unsigned: true })
  adminId: number;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: PolicyPermission, default: PolicyPermission.VIEWER })
  globalPermission: PolicyPermission;

  @Column({ type: 'jsonb' })
  grantedPermission: DetailedPermission[];

  @Column({ default: true })
  valid: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity()
@Unique(['workspaceId', 'adminId'])
export class WorkspaceAdminRequests {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @ManyToOne(() => Workspaces, (workspace) => workspace.id, { nullable: false })
  workspace: Workspaces;

  @Column({ unsigned: true })
  workspaceId: number;

  @ManyToOne(() => Admins, (admin) => admin.id, { nullable: false })
  admin: Admins;

  @Column({ unsigned: true })
  adminId: number;

  @Column({ default: false })
  approved: boolean;
}

@Entity()
@Unique(['workspaceId', 'email'])
export class WorkspaceAdminInvitations {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @ManyToOne(() => Workspaces, (workspace) => workspace.id, { nullable: false })
  workspace: Workspaces;

  @Column({ unsigned: true })
  workspaceId: number;

  @Column()
  email: string;

  @Column({ type: 'enum', enum: PolicyPermission, default: PolicyPermission.VIEWER })
  permission: PolicyPermission;

  @Column({ default: false })
  approved: boolean;

  @Column({ default: true })
  valid: boolean;
}
