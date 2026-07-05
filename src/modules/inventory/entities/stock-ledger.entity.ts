import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Merchant } from '../../merchants/merchant.entity';
import { Product } from '../../products/product.entity';

export enum StockTransactionType {
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
  ADJUSTMENT = 'ADJUSTMENT',
  RETURN = 'RETURN',
}

@Entity('stock_ledgers')
@Index('IDX_stock_merchant_id', ['merchant_id'])
@Index('IDX_stock_product_id', ['product_id'])
export class StockLedger extends BaseEntity {
  @Column({ type: 'uuid', name: 'merchant_id' })
  merchant_id: string;

  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column({ type: 'uuid', name: 'product_id' })
  product_id: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({
    type: 'enum',
    enum: StockTransactionType,
    name: 'transaction_type',
  })
  transaction_type: StockTransactionType;

  @Column({ type: 'decimal', precision: 12, scale: 3, name: 'quantity' })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, name: 'previous_stock' })
  previous_stock: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, name: 'new_stock' })
  new_stock: number;

  @Column({ type: 'varchar', name: 'reference_id', nullable: true })
  reference_id: string | null;

  @Column({ type: 'text', name: 'notes', nullable: true })
  notes: string | null;
}
