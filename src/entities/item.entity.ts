import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Payments } from './payment.entity';
import { Workspaces } from './workspace.entity';
import { WorkspaceUsers } from './workspace.user.entity';

@Entity()
export class Items {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column()
  type: string;

  @ManyToOne(() => Workspaces, (workspace) => workspace.id, { nullable: false })
  workspace: Workspaces;

  @Column({ unsigned: true })
  workspaceId: number;

  @Column({ default: true })
  valid: boolean;
}

@Unique(['itemId', 'workspaceUserId'])
@Entity()
export class UserItems {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @ManyToOne(() => Items, (item) => item.id, { nullable: false })
  item: Items;

  @Column({ unsigned: true })
  itemId: number;

  @ManyToOne(() => WorkspaceUsers, (user) => user.id, { nullable: false })
  workspaceUser: WorkspaceUsers;

  @Column({ unsigned: true })
  workspaceUserId: number;

  @Column({ unsigned: true, default: 0 })
  remainAmount: number;
}

@Index(['userItemId', 'paymentId'])
@Entity()
export class GrantedHistory {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @ManyToOne(() => UserItems, (userItem) => userItem.id, { nullable: false })
  userItem: UserItems;

  @Column({ unsigned: true })
  userItemId: number;

  @Column({ unsigned: true })
  amount: number;

  @ManyToOne(() => Payments, (payment) => payment.id)
  payment: Payments;

  @Column({ type: 'int', nullable: true, unsigned: true })
  paymentId: number | null;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  beginAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  endAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp' })
  revokedAt: Date | null;
}

@Entity()
export class UsedHistory {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @ManyToOne(() => UserItems, (userItem) => userItem.id, { nullable: false })
  userItem: UserItems;

  @Column({ unsigned: true })
  userItemId: number;

  @Column({ unsigned: true })
  amount: number;

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  revokedAt: Date | null;
}
