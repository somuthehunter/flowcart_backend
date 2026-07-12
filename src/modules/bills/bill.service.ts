import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BillRepository } from './bill.repository';
import { CreateBillDto } from './dto/create-bill.dto';
import { Bill } from './bill.entity';
import { BillItem } from './bill-item.entity';
import { Product } from '../products/product.entity';
import { Merchant } from '../merchants/merchant.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { createPaginatedResponse, PaginatedResult } from '../../common/utils/pagination.util';
import { StockLedger, StockTransactionType } from '../inventory/entities/stock-ledger.entity';

@Injectable()
export class BillService {
  constructor(
    private readonly billRepository: BillRepository,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateBillDto, merchantId: string): Promise<Bill> {
    // Execute inside a database transaction to guarantee stock consistency and invoice uniqueness
    return this.dataSource.transaction(async (manager) => {
      const transactionalProductRepo = manager.getRepository(Product);
      const transactionalBillRepo = manager.getRepository(Bill);

      let totalAmount = 0;
      const billItems: BillItem[] = [];
      const ledgerEntries: StockLedger[] = [];

      for (const itemDto of dto.items) {
        const product = await transactionalProductRepo.findOne({
          where: { id: itemDto.product_id, merchant_id: merchantId },
          relations: { brands: { brand: true } },
        });

        if (!product) {
          throw new NotFoundException(`Product with ID ${itemDto.product_id} not found.`);
        }

        let unitPrice: number;
        let brandName: string | null = null;

        if (itemDto.brand_id) {
          const productBrand = product.brands?.find(b => b.brand_id === itemDto.brand_id);
          if (!productBrand) {
            throw new BadRequestException(`Brand with ID ${itemDto.brand_id} not found for product "${product.english_name}".`);
          }
          unitPrice = Number(productBrand.selling_price);
          brandName = productBrand.brand.name;
        } else {
          if (product.base_price === null || product.base_price === undefined) {
             throw new BadRequestException(`Product "${product.english_name}" has no base price and no brand was selected.`);
          }
          unitPrice = Number(product.base_price);
        }

        // Deduct stock if stock tracking is enabled
        if (product.track_stock) {
          if (product.current_stock < itemDto.quantity) {
            throw new BadRequestException(
              `Insufficient stock for product "${product.english_name}". Available: ${product.current_stock}, requested: ${itemDto.quantity}`,
            );
          }
          const previousStock = Number(product.current_stock);
          const newStock = previousStock - itemDto.quantity;
          product.current_stock = newStock;
          product.updated_by = merchantId;
          await transactionalProductRepo.save(product);

          const ledgerEntry = manager.create(StockLedger, {
            merchant_id: merchantId,
            product_id: product.id,
            transaction_type: StockTransactionType.SALE,
            quantity: -itemDto.quantity,
            previous_stock: previousStock,
            new_stock: newStock,
            created_by: merchantId,
            updated_by: merchantId,
          });
          ledgerEntries.push(ledgerEntry);
        }

        const subtotal = unitPrice * itemDto.quantity;
        totalAmount += subtotal;

        const billItem = new BillItem();
        billItem.product_id = product.id;
        billItem.brand_id = itemDto.brand_id || null;
        billItem.brand_name = brandName;
        billItem.quantity = itemDto.quantity;
        billItem.unit_price = unitPrice;
        billItem.subtotal = subtotal;
        billItem.created_by = merchantId;
        billItem.updated_by = merchantId;
        billItems.push(billItem);
      }

      // Generate invoice number under transaction block
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
      const datePrefix = `INV-${todayStr}-`;
      
      // Lock the merchant record row to serialize bill generation for this merchant
      await manager.getRepository(Merchant).findOne({
        where: { id: merchantId },
        lock: { mode: 'pessimistic_write' },
      });

      // Count using raw query to bypass TypeORM FOR UPDATE aggregate bug
      const countResult = await manager.query(
        'SELECT COUNT(*) as count FROM bills WHERE invoice_number LIKE $1 AND merchant_id = $2',
        [`${datePrefix}%`, merchantId]
      );
      const count = Number(countResult[0].count);

      const nextSeq = String(count + 1).padStart(6, '0');
      const invoiceNumber = `${datePrefix}${nextSeq}`;

      // Update and save ledger entries with the generated invoice number
      for (const entry of ledgerEntries) {
        entry.reference_id = invoiceNumber;
        await manager.save(entry);
      }

      const taxAmount = dto.tax_amount ?? 0;
      const discountAmount = dto.discount_amount ?? 0;
      const netAmount = totalAmount + taxAmount - discountAmount;

      const bill = new Bill();
      bill.merchant_id = merchantId;
      bill.invoice_number = invoiceNumber;
      bill.customer_name = dto.customer_name || null;
      bill.customer_mobile = dto.customer_mobile || null;
      bill.payment_status = dto.payment_status || 'PENDING';
      bill.total_amount = totalAmount;
      bill.tax_amount = taxAmount;
      bill.discount_amount = discountAmount;
      bill.net_amount = netAmount;
      bill.items = billItems;
      bill.created_by = merchantId;
      bill.updated_by = merchantId;

      return transactionalBillRepo.save(bill);
    });
  }

  async findAll(
    merchantId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Bill>> {
    const [bills, total] = await this.billRepository.findAndCountPaginated(
      merchantId,
      paginationDto,
    );
    return createPaginatedResponse(bills, total, paginationDto.page ?? 1, paginationDto.limit ?? 10);
  }

  async findOne(id: string, merchantId: string): Promise<Bill> {
    const bill = await this.billRepository.findByIdAndMerchant(id, merchantId);
    if (!bill || bill.deleted_at) {
      throw new NotFoundException('Invoice not found.');
    }
    return bill;
  }

  async delete(id: string, merchantId: string): Promise<void> {
    await this.findOne(id, merchantId); // ensures invoice exists and is authorized
    await this.billRepository.softDelete(id, merchantId);
  }
}
