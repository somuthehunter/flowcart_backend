import { Entity, Column, ManyToOne, JoinColumn, Index, Unique, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Merchant } from '../merchants/merchant.entity';
import { Category } from '../categories/category.entity';
import { ProductBrand } from './product-brand.entity';

@Entity('products')
@Unique('UQ_merchant_product_code', ['merchant_id', 'product_code'])
@Unique('UQ_merchant_barcode', ['merchant_id', 'barcode'])
@Unique('UQ_merchant_qr_number', ['merchant_id', 'qr_number'])
@Index('IDX_merchant_id', ['merchant_id'])
@Index('IDX_product_code', ['product_code'])
@Index('IDX_barcode', ['barcode'])
@Index('IDX_qr_number', ['qr_number'])
export class Product extends BaseEntity {
  @Column({ type: 'uuid', name: 'merchant_id' })
  merchant_id: string;

  @ManyToOne(() => Merchant, (merchant) => merchant.products, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column({ type: 'uuid', name: 'category_id', nullable: true })
  category_id: string | null;

  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'category_id' })
  category: Category | null;

  @Column({ type: 'varchar', name: 'product_code' })
  product_code: string;

  @Column({ type: 'varchar', name: 'english_name' })
  english_name: string;

  @Column({ type: 'varchar', name: 'bengali_name', nullable: true })
  bengali_name: string | null;

  @Column({ type: 'varchar', name: 'description', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', name: 'unit', default: 'KG' })
  unit: string;

  @Column({ type: 'varchar', name: 'barcode' })
  barcode: string;

  @Column({ type: 'varchar', name: 'qr_number' })
  qr_number: string;

  @Column({ type: 'text', name: 'qr_code_image_url', nullable: true })
  qr_code_image_url: string | null;

  @Column({ type: 'varchar', name: 'image_url', nullable: true })
  image_url: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'base_price', nullable: true })
  base_price: number | null;

  @OneToMany(() => ProductBrand, (productBrand) => productBrand.product, { cascade: true })
  brands: ProductBrand[];

  @Column({ type: 'boolean', name: 'track_stock', default: false })
  track_stock: boolean;

  @Column({ type: 'decimal', precision: 12, scale: 3, name: 'current_stock', default: 0 })
  current_stock: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, name: 'minimum_stock', default: 0 })
  minimum_stock: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, name: 'maximum_stock', default: 0 })
  maximum_stock: number;
}
