import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { CategoryRepository } from './category.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Category } from './category.entity';

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async create(dto: CreateCategoryDto, merchantId: string): Promise<Category> {
    const existing = await this.categoryRepository.findByNameAndMerchant(
      dto.name,
      merchantId,
    );
    if (existing && !existing.deleted_at) {
      throw new ConflictException('Category with this name already exists.');
    }

    // If it was soft-deleted, reactivate it or create new
    if (existing && existing.deleted_at) {
      existing.deleted_at = null;
      existing.updated_by = merchantId;
      return this.categoryRepository.save(existing);
    }

    return this.categoryRepository.create({
      name: dto.name,
      merchant_id: merchantId,
      created_by: merchantId,
      updated_by: merchantId,
    });
  }

  async findAll(merchantId: string): Promise<Category[]> {
    return this.categoryRepository.findAllForMerchant(merchantId);
  }

  async findOne(id: string, merchantId: string): Promise<Category> {
    const category = await this.categoryRepository.findByIdAndMerchant(id, merchantId);
    if (!category || category.deleted_at) {
      throw new NotFoundException('Category not found.');
    }
    return category;
  }

  async delete(id: string, merchantId: string): Promise<void> {
    // Verify category exists
    await this.findOne(id, merchantId);
    await this.categoryRepository.softDelete(id, merchantId);
  }
}
