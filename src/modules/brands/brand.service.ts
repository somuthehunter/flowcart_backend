import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { BrandRepository } from './brand.repository';
import { Brand } from './brand.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { createPaginatedResponse, PaginatedResult } from '../../common/utils/pagination.util';

@Injectable()
export class BrandService {
  constructor(private readonly brandRepository: BrandRepository) {}

  async getSuggestions(search: string, merchantId: string): Promise<Brand[]> {
    return this.brandRepository.findSuggestions(search, merchantId);
  }

  async create(dto: CreateBrandDto, merchantId: string): Promise<Brand> {
    const trimmedName = dto.name.trim();
    
    // Check if brand name already exists for this merchant
    const existingBrand = await this.brandRepository.repo.findOne({
      where: { name: trimmedName, merchant_id: merchantId }
    });
    
    if (existingBrand) {
      throw new ConflictException(`Brand with name "${trimmedName}" already exists.`);
    }

    const brand = await this.brandRepository.createBrand({
      name: trimmedName,
      logo_url: dto.logo_url,
      is_active: dto.is_active ?? true,
      merchant_id: merchantId,
      created_by: merchantId,
      updated_by: merchantId,
    });

    return brand;
  }

  async findAll(merchantId: string, paginationDto: PaginationDto): Promise<PaginatedResult<Brand>> {
    const [brands, total] = await this.brandRepository.findAndCountPaginated(merchantId, paginationDto);
    return createPaginatedResponse(brands, total, paginationDto.page ?? 1, paginationDto.limit ?? 10);
  }

  async findOne(id: string, merchantId: string): Promise<Brand> {
    const brand = await this.brandRepository.findByIdAndMerchant(id, merchantId);
    if (!brand || brand.deleted_at) {
      throw new NotFoundException('Brand not found.');
    }
    return brand;
  }

  async update(id: string, dto: UpdateBrandDto, merchantId: string): Promise<Brand> {
    const brand = await this.findOne(id, merchantId);

    if (dto.name !== undefined) {
      const trimmedName = dto.name.trim();
      // Check for conflict if name is changed
      if (trimmedName !== brand.name) {
        const existingBrand = await this.brandRepository.repo.findOne({
          where: { name: trimmedName, merchant_id: merchantId }
        });
        if (existingBrand && existingBrand.id !== id) {
          throw new ConflictException(`Brand with name "${trimmedName}" already exists.`);
        }
      }
      brand.name = trimmedName;
    }

    if (dto.logo_url !== undefined) brand.logo_url = dto.logo_url;
    if (dto.is_active !== undefined) brand.is_active = dto.is_active;

    brand.updated_by = merchantId;
    return this.brandRepository.save(brand);
  }

  async delete(id: string, merchantId: string): Promise<void> {
    await this.findOne(id, merchantId); // ensures brand exists
    await this.brandRepository.softDelete(id, merchantId);
  }
}
