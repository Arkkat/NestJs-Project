import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Payments } from './payment.entity';
import { Workspaces } from './workspace.entity';
import { WorkspaceUsers } from './workspace.user.entity';

export enum RenewalType {
  WEEK = 'week',
  MONTH = 'month',
  ANNUAL = 'annual',
  PERMANENT = 'permanent',
}

export function renewSQL(type: RenewalType) {
  switch (type) {
    case RenewalType.WEEK:
      return 'DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 7 DAY)';
    case RenewalType.MONTH:
      return 'DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 MONTH)';
    case RenewalType.ANNUAL:
      return 'DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 YEAR)';
    case RenewalType.PERMANENT:
      return 'DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 100 YEAR)';
  }
}

@Entity()
export class Subscriptions {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @ManyToOne(() => Workspaces, (workspace) => workspace.id, { nullable: false })
  workspace: Workspaces;

  @Column({ unsigned: true })
  workspaceId: number;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: RenewalType })
  renewalType: RenewalType;

  @Column({ default: true })
  paidPlan: boolean;

  @Column({ default: true })
  automaticRenewal: boolean;

  @Column({ default: true })
  valid: boolean;
}

@Entity()
export class UserSubscriptions {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @ManyToOne(() => Subscriptions, (subscription) => subscription.id, { nullable: false })
  currentSubscription: Subscriptions;

  @Column({ unsigned: true })
  currentSubscriptionId: number;

  @ManyToOne(() => Subscriptions, (subscription) => subscription.id)
  nextSubscription: Subscriptions;

  @Column({ type: 'int', unsigned: true, nullable: true })
  nextSubscriptionId: number | null;

  @OneToOne(() => WorkspaceUsers, (workspaceUser) => workspaceUser.id, { nullable: false })
  @JoinColumn()
  workspaceUser: WorkspaceUsers;

  @Column({ unsigned: true })
  workspaceUserId: number;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  renewedAt: Date;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  renewAt: Date;

  @Column({ default: false })
  suspended: boolean;
}

export enum TxType {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
}

@Entity()
export class UserSubscriptionHistory {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @ManyToOne(() => UserSubscriptions, (userSubscription) => userSubscription.id, { nullable: false })
  userSubscription: UserSubscriptions;

  @Column({ unsigned: true })
  userSubscriptionId: number;

  @ManyToOne(() => Payments, (payment) => payment.id)
  payment: Payments;

  @Column({ type: 'int', unsigned: true, nullable: true })
  paymentId: number | null;

  @Column({ type: 'enum', enum: TxType, default: TxType.AUTOMATIC })
  txType: TxType;

  @CreateDateColumn()
  createdAt: Date;
}
