import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bill } from './bill.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class BillRepository {
  constructor(
    @InjectRepository(Bill)
    private readonly repo: Repository<Bill>,
  ) {}

  async create(billData: Partial<Bill>): Promise<Bill> {
    const bill = this.repo.create(billData);
    return this.repo.save(bill);
  }

  async findByIdAndMerchant(id: string, merchantId: string): Promise<Bill | null> {
    return this.repo.findOne({
      where: { id, merchant_id: merchantId },
      relations: { items: { product: true } },
    });
  }

  async save(bill: Bill): Promise<Bill> {
    return this.repo.save(bill);
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
  ): Promise<[Bill[], number]> {
    const { page = 1, limit = 10, search, sort, order = 'ASC' } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repo.createQueryBuilder('bill')
      .where('bill.merchant_id = :merchantId', { merchantId })
      .andWhere('bill.deleted_at IS NULL');

    if (search) {
      queryBuilder.andWhere(
        'bill.invoice_number ILIKE :search',
        { search: `%${search}%` },
      );
    }

    if (sort) {
      const orderDir = order.toUpperCase() as 'ASC' | 'DESC';
      const cleanSort = sort.replace(/[^a-zA-Z0-9_]/g, '');
      if (cleanSort) {
        queryBuilder.orderBy(`bill.${cleanSort}`, orderDir);
      }
    } else {
      queryBuilder.orderBy('bill.created_at', 'DESC');
    }

    queryBuilder.skip(skip).take(limit);
    queryBuilder.leftJoinAndSelect('bill.items', 'items');
    queryBuilder.leftJoinAndSelect('items.product', 'product');

    return queryBuilder.getManyAndCount();
  }

  async generateInvoiceNumber(): Promise<string> {
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // e.g. '20260701'
    const datePrefix = `INV-${todayStr}-`;
    
    // Find the count of bills created today (including soft-deleted to avoid duplicates)
    const count = await this.repo.createQueryBuilder('bill')
      .where('bill.invoice_number LIKE :prefix', { prefix: `${datePrefix}%` })
      .withDeleted()
      .getCount();

    const nextSeq = String(count + 1).padStart(6, '0');
    return `${datePrefix}${nextSeq}`;
  }
}
