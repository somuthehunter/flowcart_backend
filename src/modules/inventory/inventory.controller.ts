import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { BulkStockDto } from './dto/bulk-stock.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentMerchant } from '../../common/decorators/current-merchant.decorator';
import { StockTransactionType } from './entities/stock-ledger.entity';

@ApiTags('Inventory & Stock')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('adjust')
  @ApiOperation({ summary: 'Manually adjust stock (damage, loss, manual fix)' })
  @ApiResponse({ status: 201, description: 'Stock adjusted successfully' })
  async adjustStock(
    @Body() dto: AdjustStockDto,
    @CurrentMerchant('id') merchantId: string,
  ) {
    // Override type if not provided correctly, but DTO should enforce it
    if (!dto.transaction_type) {
      dto.transaction_type = StockTransactionType.ADJUSTMENT;
    }
    const product = await this.inventoryService.adjustStock(merchantId, dto);
    return {
      success: true,
      message: 'Stock adjusted successfully.',
      data: product,
    };
  }

  @Post('purchase')
  @ApiOperation({ summary: 'Add purchased stock' })
  @ApiResponse({ status: 201, description: 'Stock added successfully' })
  async purchaseStock(
    @Body() dto: AdjustStockDto,
    @CurrentMerchant('id') merchantId: string,
  ) {
    dto.transaction_type = StockTransactionType.PURCHASE;
    const product = await this.inventoryService.adjustStock(merchantId, dto);
    return {
      success: true,
      message: 'Purchase stock added successfully.',
      data: product,
    };
  }

  @Post('bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk add or adjust stock' })
  @ApiResponse({ status: 200, description: 'Bulk operation results' })
  async bulkAddStock(
    @Body() dto: BulkStockDto,
    @CurrentMerchant('id') merchantId: string,
  ) {
    const results = await this.inventoryService.bulkAddStock(merchantId, dto);
    return {
      success: true,
      message: 'Bulk stock operation completed.',
      data: results,
    };
  }

  @Get('ledger')
  @ApiOperation({ summary: 'Get stock ledger history' })
  @ApiResponse({ status: 200, description: 'Paginated stock ledger' })
  async getLedger(
    @Query() paginationDto: PaginationDto,
    @Query('product_id') productId: string,
    @CurrentMerchant('id') merchantId: string,
  ) {
    const result = await this.inventoryService.getLedger(merchantId, paginationDto, productId);
    return {
      success: true,
      ...result,
    };
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get low stock alerts' })
  @ApiResponse({ status: 200, description: 'Paginated list of low stock products' })
  async getAlerts(
    @Query() paginationDto: PaginationDto,
    @CurrentMerchant('id') merchantId: string,
  ) {
    const result = await this.inventoryService.getLowStockAlerts(merchantId, paginationDto);
    return {
      success: true,
      ...result,
    };
  }
}
