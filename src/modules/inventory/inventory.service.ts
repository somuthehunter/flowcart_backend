import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { StockLedgerRepository } from './repositories/stock-ledger.repository';
import { ProductRepository } from '../products/product.repository';
import { Product } from '../products/product.entity';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { BulkStockDto } from './dto/bulk-stock.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { createPaginatedResponse } from '../../common/utils/pagination.util';
import { StockLedger } from './entities/stock-ledger.entity';

@Injectable()
export class InventoryService {
  constructor(
    private readonly stockLedgerRepository: StockLedgerRepository,
    private readonly productRepository: ProductRepository,
    private readonly dataSource: DataSource,
  ) {}

  async adjustStock(merchantId: string, adjustDto: AdjustStockDto): Promise<Product> {
    const { product_id, quantity, transaction_type, reference_id, notes } = adjustDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = await queryRunner.manager.findOne(Product, {
        where: { id: product_id, merchant_id: merchantId },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${product_id} not found`);
      }

      if (!product.track_stock) {
        throw new BadRequestException(`Stock tracking is disabled for product: ${product.english_name}`);
      }

      const previousStock = Number(product.current_stock) || 0;
      const newStock = previousStock + Number(quantity);

      if (newStock < 0) {
        throw new BadRequestException(`Insufficient stock for product: ${product.english_name}`);
      }

      // Update product current stock
      product.current_stock = newStock;
      await queryRunner.manager.save(Product, product);

      // Create ledger entry
      const ledgerEntry = queryRunner.manager.create(StockLedger, {
        merchant_id: merchantId,
        product_id: product.id,
        transaction_type,
        quantity,
        previous_stock: previousStock,
        new_stock: newStock,
        reference_id,
        notes,
        created_by: merchantId,
        updated_by: merchantId,
      });

      await queryRunner.manager.save(StockLedger, ledgerEntry);

      await queryRunner.commitTransaction();
      return product;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async bulkAddStock(merchantId: string, bulkDto: BulkStockDto) {
    const results: any[] = [];
    for (const adjustment of bulkDto.adjustments) {
      try {
        const result = await this.adjustStock(merchantId, adjustment);
        results.push({ product_id: adjustment.product_id, status: 'success', current_stock: result.current_stock });
      } catch (error: any) {
        results.push({ product_id: adjustment.product_id, status: 'failed', reason: error.message });
      }
    }
    return results;
  }

  async getLedger(merchantId: string, paginationDto: PaginationDto, productId?: string) {
    const { page = 1, limit = 10, sort = 'created_at', order = 'DESC' } = paginationDto;

    const queryBuilder = this.stockLedgerRepository.createQueryBuilder('ledger')
      .where('ledger.merchant_id = :merchantId', { merchantId })
      .leftJoinAndSelect('ledger.product', 'product');

    if (productId) {
      queryBuilder.andWhere('ledger.product_id = :productId', { productId });
    }

    queryBuilder
      .orderBy(`ledger.${sort}`, order as 'ASC' | 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return createPaginatedResponse(items, total, page, limit);
  }

  async getLowStockAlerts(merchantId: string, paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;

    const queryBuilder = this.productRepository.repo.createQueryBuilder('product')
      .where('product.merchant_id = :merchantId', { merchantId })
      .andWhere('product.track_stock = :trackStock', { trackStock: true })
      .andWhere('product.current_stock <= product.minimum_stock')
      .orderBy('product.current_stock', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return createPaginatedResponse(items, total, page, limit);
  }
}
