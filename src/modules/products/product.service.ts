import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as QRCode from 'qrcode';
import { ProductRepository } from './product.repository';
import { CategoryRepository } from '../categories/category.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { Product } from './product.entity';
import { ProductBrand } from './product-brand.entity';
import { Category } from '../categories/category.entity';
import { Merchant } from '../merchants/merchant.entity';
import { Brand } from '../brands/brand.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { createPaginatedResponse, PaginatedResult } from '../../common/utils/pagination.util';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateProductDto, merchantId: string): Promise<Product> {
    return this.dataSource.transaction(async (manager) => {
      const transactionalProductRepo = manager.getRepository(Product);
      const transactionalCategoryRepo = manager.getRepository(Category);
      const transactionalBrandRepo = manager.getRepository(Brand);
      const transactionalProductBrandRepo = manager.getRepository(ProductBrand);

      // Validate at least one brand is provided
      if (!dto.brands || dto.brands.length === 0) {
        throw new BadRequestException('At least one brand must be provided.');
      }

      // 1. Verify Category exists and belongs to Merchant
      if (dto.category_id) {
        const category = await transactionalCategoryRepo.findOne({
          where: { id: dto.category_id, merchant_id: merchantId },
        });
        if (!category || category.deleted_at) {
          throw new BadRequestException('Invalid category reference.');
        }
      }

      // 2. Lock the merchant record row to serialize product creations for this merchant
      await manager.getRepository(Merchant).findOne({
        where: { id: merchantId },
        lock: { mode: 'pessimistic_write' },
      });

      // 3. Count current products (including soft-deleted)
      // 3. Count current products (including soft-deleted) using raw query to bypass TypeORM FOR UPDATE bug
      const countResult = await manager.query(
        'SELECT COUNT(*) as count FROM products WHERE merchant_id = $1',
        [merchantId]
      );
      const count = Number(countResult[0].count);

      const nextSeq = count + 1;

      // 3. Generate sequential identifiers
      const productCode = `FLOW-PROD-${String(nextSeq).padStart(6, '0')}`;
      const barcode = `890${String(nextSeq).padStart(9, '0')}`;
      const qrNumber = `FLOW-QR-${String(nextSeq).padStart(6, '0')}`;

      // 4. Generate base64 QR Image containing only the qrNumber
      let qrCodeImageUrl: string | null = null;
      try {
        qrCodeImageUrl = await QRCode.toDataURL(qrNumber);
      } catch (err) {
        // Fallback or log error
        qrCodeImageUrl = null;
      }

      // 5. Create new product record
      const product = transactionalProductRepo.create({
        category_id: dto.category_id,
        english_name: dto.english_name,
        bengali_name: dto.bengali_name,
        description: dto.description,
        unit: dto.unit || 'KG',
        track_stock: dto.track_stock ?? false,
        current_stock: dto.current_stock ?? 0,
        minimum_stock: dto.minimum_stock ?? 0,
        image_url: dto.image_url,
        product_code: productCode,
        barcode: barcode,
        qr_number: qrNumber,
        qr_code_image_url: qrCodeImageUrl,
        merchant_id: merchantId,
        created_by: merchantId,
        updated_by: merchantId,
      });

      const savedProduct = await transactionalProductRepo.save(product);

      // 6. Handle Brands
      for (const bDto of dto.brands) {
        const trimmedName = bDto.brand_name.trim();
        let brand = await transactionalBrandRepo.findOne({
          where: { name: trimmedName, merchant_id: merchantId }
        });

        if (!brand) {
          brand = transactionalBrandRepo.create({
            name: trimmedName,
            merchant_id: merchantId,
            created_by: merchantId,
            updated_by: merchantId,
          });
          brand = await transactionalBrandRepo.save(brand);
        }

        const productBrand = transactionalProductBrandRepo.create({
          product_id: savedProduct.id,
          brand_id: brand.id,
          selling_price: bDto.selling_price,
          purchase_price: bDto.purchase_price || null,
          sku: bDto.sku || null,
          created_by: merchantId,
          updated_by: merchantId,
        });

        await transactionalProductBrandRepo.save(productBrand);
      }

      return this.findOne(savedProduct.id, merchantId);
    });
  }

  async findAll(
    merchantId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Product>> {
    const [products, total] = await this.productRepository.findAndCountPaginated(
      merchantId,
      paginationDto,
    );
    return createPaginatedResponse(products, total, paginationDto.page ?? 1, paginationDto.limit ?? 10);
  }

  async findOne(id: string, merchantId: string): Promise<Product> {
    const product = await this.productRepository.findByIdAndMerchant(id, merchantId);
    if (!product || product.deleted_at) {
      throw new NotFoundException('Product not found.');
    }
    return product;
  }

  async scan(code: string, merchantId: string): Promise<Product> {
    let product = await this.productRepository.findByQrNumberAndMerchant(code, merchantId);
    if (!product) {
      // Fallback to barcode lookup
      product = await this.productRepository.findByBarcodeAndMerchant(code, merchantId);
    }
    if (!product || product.deleted_at) {
      throw new NotFoundException(`Product with scanned code "${code}" not found.`);
    }
    return product;
  }

  async update(id: string, dto: Partial<CreateProductDto>, merchantId: string): Promise<Product> {
    return this.dataSource.transaction(async (manager) => {
      const transactionalProductRepo = manager.getRepository(Product);
      
      const product = await this.findOne(id, merchantId);

      // Verify Category if changed
      if (dto.category_id) {
        const category = await manager.getRepository(Category).findOne({
          where: { id: dto.category_id, merchant_id: merchantId },
        });
        if (!category || category.deleted_at) {
          throw new BadRequestException('Invalid category reference.');
        }
        product.category_id = dto.category_id;
      } else if (dto.category_id === null) {
        product.category_id = null;
      }

      // Map only merchant-modifiable fields (strict whitelist)
      if (dto.english_name !== undefined) product.english_name = dto.english_name;
      if (dto.bengali_name !== undefined) product.bengali_name = dto.bengali_name;
      if (dto.description !== undefined) product.description = dto.description;
      if (dto.unit !== undefined) product.unit = dto.unit;
      if (dto.track_stock !== undefined) product.track_stock = dto.track_stock;
      if (dto.current_stock !== undefined) product.current_stock = dto.current_stock;
      if (dto.minimum_stock !== undefined) product.minimum_stock = dto.minimum_stock;
      if (dto.image_url !== undefined) product.image_url = dto.image_url;

      product.updated_by = merchantId;
      await transactionalProductRepo.save(product);

      // Handle Brands Update if provided
      if (dto.brands && dto.brands.length > 0) {
        const transactionalBrandRepo = manager.getRepository(Brand);
        const transactionalProductBrandRepo = manager.getRepository(ProductBrand);
        
        // Hard replace strategy for simplicity: Delete existing ProductBrands and recreate
        await transactionalProductBrandRepo.delete({ product_id: product.id });

        for (const bDto of dto.brands) {
          const trimmedName = bDto.brand_name.trim();
          let brand = await transactionalBrandRepo.findOne({
            where: { name: trimmedName, merchant_id: merchantId }
          });

          if (!brand) {
            brand = transactionalBrandRepo.create({
              name: trimmedName,
              merchant_id: merchantId,
              created_by: merchantId,
              updated_by: merchantId,
            });
            brand = await transactionalBrandRepo.save(brand);
          }

          const productBrand = transactionalProductBrandRepo.create({
            product_id: product.id,
            brand_id: brand.id,
            selling_price: bDto.selling_price,
            purchase_price: bDto.purchase_price || null,
            sku: bDto.sku || null,
            created_by: merchantId,
            updated_by: merchantId,
          });

          await transactionalProductBrandRepo.save(productBrand);
        }
      }

      return this.findOne(product.id, merchantId);
    });
  }

  async delete(id: string, merchantId: string): Promise<void> {
    await this.findOne(id, merchantId);
    await this.productRepository.softDelete(id, merchantId);
  }
}
