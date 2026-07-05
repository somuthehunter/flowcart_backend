import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Product } from './product.entity';
import { Brand } from '../brands/brand.entity';

@Entity('product_brands')
@Unique('UQ_product_brand', ['product_id', 'brand_id'])
@Index('IDX_product_brand_product_id', ['product_id'])
export class ProductBrand extends BaseEntity {
  @Column({ type: 'uuid', name: 'product_id' })
  product_id: string;

  @ManyToOne(() => Product, (product) => product.brands, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'uuid', name: 'brand_id' })
  brand_id: string;

  @ManyToOne(() => Brand, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'selling_price' })
  selling_price: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'purchase_price', nullable: true })
  purchase_price: number | null;

  @Column({ type: 'varchar', name: 'sku', nullable: true })
  sku: string | null;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  is_active: boolean;
}
