import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ProductRepository {
  constructor(
    @InjectRepository(Product)
    public readonly repo: Repository<Product>,
  ) {}

  async create(productData: Partial<Product>): Promise<Product> {
    const product = this.repo.create(productData);
    return this.repo.save(product);
  }

  async findByIdAndMerchant(id: string, merchantId: string): Promise<Product | null> {
    return this.repo.findOne({
      where: { id, merchant_id: merchantId },
      relations: { category: true, brands: { brand: true } },
    });
  }

  async findByCodeAndMerchant(code: string, merchantId: string): Promise<Product | null> {
    return this.repo.findOne({ where: { product_code: code, merchant_id: merchantId } });
  }

  async findByBarcodeAndMerchant(barcode: string, merchantId: string): Promise<Product | null> {
    return this.repo.findOne({ 
      where: { barcode, merchant_id: merchantId },
      relations: { category: true, brands: { brand: true } },
    });
  }

  async findByQrNumberAndMerchant(qrNumber: string, merchantId: string): Promise<Product | null> {
    return this.repo.findOne({
      where: { qr_number: qrNumber, merchant_id: merchantId },
      relations: { category: true, brands: { brand: true } },
    });
  }

  async save(product: Product): Promise<Product> {
    return this.repo.save(product);
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

  async findAndCountPaginated(
    merchantId: string,
    paginationDto: PaginationDto,
  ): Promise<[Product[], number]> {
    const { page = 1, limit = 10, search, sort, order = 'ASC' } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repo.createQueryBuilder('product')
      .where('product.merchant_id = :merchantId', { merchantId })
      .andWhere('product.deleted_at IS NULL');

    if (search) {
      queryBuilder.andWhere(
        '(product.product_code ILIKE :search OR product.english_name ILIKE :search OR product.bengali_name ILIKE :search OR product.barcode ILIKE :search OR product.qr_number ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (sort) {
      const orderDir = order.toUpperCase() as 'ASC' | 'DESC';
      const cleanSort = sort.replace(/[^a-zA-Z0-9_]/g, '');
      if (cleanSort && cleanSort !== 'price') {
        queryBuilder.orderBy(`product.${cleanSort}`, orderDir);
      }
    } else {
      queryBuilder.orderBy('product.created_at', 'DESC');
    }

    queryBuilder.skip(skip).take(limit);

    // Join category and brands relations
    queryBuilder.leftJoinAndSelect('product.category', 'category');
    queryBuilder.leftJoinAndSelect('product.brands', 'productBrand', 'productBrand.is_active = true');
    queryBuilder.leftJoinAndSelect('productBrand.brand', 'brand');

    return queryBuilder.getManyAndCount();
  }
}
