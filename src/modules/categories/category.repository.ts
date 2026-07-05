import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';

@Injectable()
export class CategoryRepository {
  constructor(
    @InjectRepository(Category)
    private readonly repo: Repository<Category>,
  ) {}

  async create(categoryData: Partial<Category>): Promise<Category> {
    const category = this.repo.create(categoryData);
    return this.repo.save(category);
  }

  async findByIdAndMerchant(id: string, merchantId: string): Promise<Category | null> {
    return this.repo.findOne({ where: { id, merchant_id: merchantId } });
  }

  async findByNameAndMerchant(name: string, merchantId: string): Promise<Category | null> {
    return this.repo.findOne({ where: { name, merchant_id: merchantId } });
  }

  async findAllForMerchant(merchantId: string): Promise<Category[]> {
    return this.repo.find({ where: { merchant_id: merchantId } });
  }

  async save(category: Category): Promise<Category> {
    return this.repo.save(category);
  }

  async softDelete(id: string, merchantId: string): Promise<void> {
    await this.repo.update(
      { id, merchant_id: merchantId },
      {
        deleted_at: new Date(),
        updated_by: merchantId,
      },
    );
  }
}
