import { Entity, Column, ManyToOne, JoinColumn, Index, Unique, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Merchant } from '../merchants/merchant.entity';
import { ProductBrand } from '../products/product-brand.entity';

@Entity('brands')
@Unique('UQ_merchant_brand_name', ['merchant_id', 'name'])
@Index('IDX_brand_merchant_id', ['merchant_id'])
export class Brand extends BaseEntity {
  @Column({ type: 'uuid', name: 'merchant_id' })
  merchant_id: string;

  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column({ type: 'varchar', name: 'name' })
  name: string;

  @Column({ type: 'varchar', name: 'logo_url', nullable: true })
  logo_url: string | null;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  is_active: boolean;

  @OneToMany(() => ProductBrand, (productBrand) => productBrand.brand)
  productBrands: ProductBrand[];
}
