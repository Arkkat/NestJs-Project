import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Workspaces } from './workspace.entity';
import { WorkspaceUsers } from './workspace.user.entity';

export enum CouponType {
  INFINITE = 'infinite',
  ONCE = 'once',
}

@Entity()
export class Coupons {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ type: 'enum', enum: CouponType, default: CouponType.ONCE })
  couponType: CouponType;

  @Column({ default: true })
  valid: boolean;

  @ManyToOne(() => Workspaces, (workspace) => workspace.id, { nullable: false })
  workspace: Workspaces;

  @Column()
  workspaceId: number;

  @ManyToOne(() => WorkspaceUsers, (user) => user.id)
  user: WorkspaceUsers;

  @Column({ nullable: true, unsigned: true })
  userId: number;

  @Column()
  code: string;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  beginAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  endAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
