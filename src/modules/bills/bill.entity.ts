import { Entity, Column, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Merchant } from '../merchants/merchant.entity';
import { BillItem } from './bill-item.entity';

@Entity('bills')
@Index('IDX_invoice_number', ['invoice_number'])
@Index('IDX_bill_merchant_id', ['merchant_id'])
export class Bill extends BaseEntity {
  @Column({ type: 'uuid', name: 'merchant_id' })
  merchant_id: string;

  @ManyToOne(() => Merchant, (merchant) => merchant.bills, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column({ type: 'varchar', name: 'invoice_number', unique: true })
  invoice_number: string;

  @Column({ type: 'varchar', name: 'customer_name', nullable: true })
  customer_name: string | null;

  @Column({ type: 'varchar', name: 'customer_mobile', nullable: true })
  customer_mobile: string | null;

  @Column({ type: 'varchar', name: 'payment_status', default: 'PENDING' })
  payment_status: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_amount' })
  total_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'tax_amount', default: 0 })
  tax_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'discount_amount', default: 0 })
  discount_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'net_amount' })
  net_amount: number;

  @OneToMany(() => BillItem, (item) => item.bill, { cascade: true })
  items: BillItem[];
}
