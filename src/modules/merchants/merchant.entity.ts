import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Category } from '../categories/category.entity';
import { Product } from '../products/product.entity';
import { Bill } from '../bills/bill.entity';

@Entity('merchants')
export class Merchant extends BaseEntity {
  @Column({ type: 'varchar', name: 'owner_name' })
  owner_name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', name: 'phone_number', unique: true })
  phone_number: string;

  @Column({ type: 'varchar', name: 'shop_name' })
  shop_name: string;

  @Column({ type: 'varchar', name: 'shop_type' })
  shop_type: string;

  @OneToMany(() => Category, (category) => category.merchant, { cascade: true })
  categories: Category[];

  @OneToMany(() => Product, (product) => product.merchant, { cascade: true })
  products: Product[];

  @OneToMany(() => Bill, (bill) => bill.merchant, { cascade: true })
  bills: Bill[];
}
