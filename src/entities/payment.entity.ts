import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum PaymentType {
  TOSS = 'toss',
}

@Entity()
export class Payments {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ type: 'enum', enum: PaymentType })
  type: PaymentType;

  @Column({ unsigned: true, default: 0 })
  amount: number;

  @Column({ type: 'jsonb' })
  txInfo: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;
}
