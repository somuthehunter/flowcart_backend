import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Bill } from './bill.entity';
import { Product } from '../products/product.entity';
import { Brand } from '../brands/brand.entity';

@Entity('bill_items')
export class BillItem extends BaseEntity {
  @Column({ type: 'uuid', name: 'bill_id' })
  bill_id: string;

  @ManyToOne(() => Bill, (bill) => bill.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bill_id' })
  bill: Bill;

  @Column({ type: 'uuid', name: 'product_id' })
  product_id: string;

  @ManyToOne(() => Product, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'uuid', name: 'brand_id', nullable: true })
  brand_id: string | null;

  @ManyToOne(() => Brand, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;

  @Column({ type: 'varchar', name: 'brand_name', nullable: true })
  brand_name: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'unit_price' })
  unit_price: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;
}
