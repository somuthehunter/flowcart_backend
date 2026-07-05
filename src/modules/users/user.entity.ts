import { Entity, Column, ManyToOne, JoinColumn, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { Merchant } from '../merchants/merchant.entity';
import { RefreshToken } from '../refresh-tokens/refresh-token.entity';

@Entity('users')
export class User extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', name: 'email', unique: true })
  email: string;

  @Column({ type: 'varchar', name: 'password' })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.MerchantOwner,
  })
  role: UserRole;

  @Column({ type: 'uuid', name: 'merchant_id', nullable: true })
  merchant_id: string | null;

  @ManyToOne(() => Merchant, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant | null;

  @OneToMany(() => RefreshToken, (token) => token.user, { cascade: true })
  refresh_tokens: RefreshToken[];
}
