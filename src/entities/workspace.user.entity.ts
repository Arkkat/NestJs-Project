import { Column, CreateDateColumn, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Subscriptions, UserSubscriptions } from './subscription.entity';
import { Users } from './user.entity';
import { Workspaces } from './workspace.entity';

@Entity()
export class WorkspaceUsers {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @ManyToOne(() => Workspaces, (workspace) => workspace.id, { nullable: false })
  workspace: Workspaces;

  @Column({ unsigned: true })
  workspaceId: number;

  @ManyToOne(() => Users, (user) => user.id, { nullable: false })
  user: Users;

  @Column({ unsigned: true })
  userId: number;

  @Column()
  name: string;

  @Column({ generatedType: 'STORED', asExpression: `valid_by_user and valid_by_admin` })
  valid: boolean;

  @Column({ default: true })
  validByUser: boolean;

  @Column({ default: true })
  validByAdmin: boolean;

  @Column({ type: 'numeric', precision: 10, default: 50000 })
  workspaceOrderOfUser: string;

  @CreateDateColumn()
  createdAt: Date;

  // ETC Relation which does not have foreign key in this entity
  @OneToOne(() => Subscriptions, (userSubscription) => userSubscription.id)
  workspaceUser: UserSubscriptions;

  @Column({ unsigned: true, nullable: true })
  workspaceUserId: number;
}
