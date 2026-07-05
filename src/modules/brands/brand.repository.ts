import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from './brand.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class BrandRepository {
  constructor(
    @InjectRepository(Brand)
    public readonly repo: Repository<Brand>,
  ) {}

  async findSuggestions(search: string, merchantId: string): Promise<Brand[]> {
    const query = this.repo.createQueryBuilder('brand')
      .where('brand.merchant_id = :merchantId', { merchantId })
      .andWhere('brand.is_active = :isActive', { isActive: true })
      .andWhere('brand.deleted_at IS NULL');
      
    if (search) {
      query.andWhere('brand.name ILIKE :search', { search: `%${search}%` });
    }

    return query.take(10).getMany();
  }

  async findByNameOrCreate(name: string, merchantId: string): Promise<Brand> {
    const trimmedName = name.trim();
    let brand = await this.repo.findOne({
      where: { name: trimmedName, merchant_id: merchantId }
    });
    
    if (!brand) {
      brand = this.repo.create({
        name: trimmedName,
        merchant_id: merchantId,
        created_by: merchantId,
        updated_by: merchantId,
      });
      brand = await this.repo.save(brand);
    }
    
    return brand;
  }

  async findAndCountPaginated(
    merchantId: string,
    paginationDto: PaginationDto,
  ): Promise<[Brand[], number]> {
    const { page = 1, limit = 10, search, sort, order = 'ASC' } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repo.createQueryBuilder('brand')
      .where('brand.merchant_id = :merchantId', { merchantId })
      .andWhere('brand.deleted_at IS NULL');

    if (search) {
      queryBuilder.andWhere('brand.name ILIKE :search', { search: `%${search}%` });
    }

    if (sort) {
      const orderDir = order.toUpperCase() as 'ASC' | 'DESC';
      const cleanSort = sort.replace(/[^a-zA-Z0-9_]/g, '');
      if (cleanSort) {
        queryBuilder.orderBy(`brand.${cleanSort}`, orderDir);
      }
    } else {
      queryBuilder.orderBy('brand.created_at', 'DESC');
    }

    queryBuilder.skip(skip).take(limit);

    return queryBuilder.getManyAndCount();
  }

  async findByIdAndMerchant(id: string, merchantId: string): Promise<Brand | null> {
    return this.repo.findOne({
      where: { id, merchant_id: merchantId },
      relations: {
        productBrands: {
          product: true
        }
      }
    });
  }

  async createBrand(brandData: Partial<Brand>): Promise<Brand> {
    const brand = this.repo.create(brandData);
    return this.repo.save(brand);
  }

  async save(brand: Brand): Promise<Brand> {
    return this.repo.save(brand);
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
