import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentMerchant } from '../../common/decorators/current-merchant.decorator';
import { generateLabelsPdf, generateCatalogPdf } from '../../common/utils/export-pdf.util';
import { generateExcelReport } from '../../common/utils/export-excel.util';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new catalog product' })
  @ApiResponse({ status: 201, description: 'Product created successfully, identifiers auto-generated' })
  @ApiResponse({ status: 400, description: 'Validation failed or invalid category' })
  async create(
    @Body() dto: CreateProductDto,
    @CurrentMerchant('id') merchantId: string,
  ) {
    const product = await this.productService.create(dto, merchantId);
    return {
      success: true,
      message: 'Product created successfully.',
      data: product,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated list of catalog products' })
  @ApiResponse({ status: 200, description: 'Paginated lists returned' })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @CurrentMerchant('id') merchantId: string,
  ) {
    const result = await this.productService.findAll(merchantId, paginationDto);
    return {
      success: true,
      ...result,
    };
  }

  @Post('scan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Scan QR Number or Barcode during billing' })
  @ApiBody({ schema: { type: 'object', properties: { code: { type: 'string', example: 'FLOW-QR-000001' } } } })
  @ApiResponse({ status: 200, description: 'Product details successfully scanned' })
  @ApiResponse({ status: 404, description: 'Product scanned code not found' })
  async scan(
    @Body('code') code: string,
    @CurrentMerchant('id') merchantId: string,
  ) {
    const product = await this.productService.scan(code, merchantId);
    return {
      success: true,
      data: product,
    };
  }

  @Get('export/labels')
  @ApiOperation({ summary: 'Export A4 grid product sheet PDF for printing labels' })
  @ApiQuery({ name: 'layout', required: false, enum: ['Portrait', 'Landscape'], default: 'Landscape' })
  @ApiQuery({ name: 'qr_size', required: false, type: 'number', default: 55 })
  @ApiQuery({ name: 'rows', required: false, type: 'number' })
  @ApiQuery({ name: 'columns', required: false, type: 'number' })
  @ApiResponse({ status: 200, description: 'PDF binary stream' })
  async exportLabels(
    @Query('layout') layout: 'Portrait' | 'Landscape',
    @Query('qr_size') qrSize: number,
    @Query('rows') rows: number,
    @Query('columns') columns: number,
    @CurrentMerchant('id') merchantId: string,
    @Res() res: Response,
  ) {
    // Load all non-deleted products for this merchant
    const { data: products } = await this.productService.findAll(merchantId, { page: 1, limit: 1000 });
    
    const buffer = await generateLabelsPdf(products, {
      layout: layout || 'Landscape',
      qr_size: qrSize ? Number(qrSize) : undefined,
      rows: rows ? Number(rows) : undefined,
      columns: columns ? Number(columns) : undefined,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="product-labels.pdf"',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('export/catalog')
  @ApiOperation({ summary: 'Export product landscape catalog PDF' })
  @ApiResponse({ status: 200, description: 'PDF binary stream' })
  async exportCatalog(
    @CurrentMerchant('id') merchantId: string,
    @Res() res: Response,
  ) {
    const { data: products } = await this.productService.findAll(merchantId, { page: 1, limit: 1000 });
    const buffer = await generateCatalogPdf(products);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="product-catalog.pdf"',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('export/excel')
  @ApiOperation({ summary: 'Export complete product catalog in Excel format' })
  @ApiResponse({ status: 200, description: 'Excel binary stream' })
  async exportExcel(
    @CurrentMerchant('id') merchantId: string,
    @Res() res: Response,
  ) {
    const { data: products } = await this.productService.findAll(merchantId, { page: 1, limit: 1000 });
    const buffer = await generateExcelReport(products);

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="products.xlsx"',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Post('import')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Bulk product catalog import placeholder (future ready)' })
  @ApiResponse({ status: 202, description: 'Placeholder accepted response' })
  async importProducts() {
    return {
      success: true,
      message: 'Bulk product import will be supported in future versions. CSV and Excel file formats will be integrated.',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get catalog product details by ID' })
  @ApiResponse({ status: 200, description: 'Product details returned' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentMerchant('id') merchantId: string,
  ) {
    const product = await this.productService.findOne(id, merchantId);
    return {
      success: true,
      data: product,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partially update product details' })
  @ApiResponse({ status: 200, description: 'Product updated successfully, identifiers remain immutable' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateProductDto>,
    @CurrentMerchant('id') merchantId: string,
  ) {
    const product = await this.productService.update(id, dto, merchantId);
    return {
      success: true,
      message: 'Product updated successfully.',
      data: product,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete a product' })
  @ApiResponse({ status: 200, description: 'Product soft-deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async remove(
    @Param('id') id: string,
    @CurrentMerchant('id') merchantId: string,
  ) {
    await this.productService.delete(id, merchantId);
    return {
      success: true,
      message: 'Product deleted successfully.',
    };
  }
}
