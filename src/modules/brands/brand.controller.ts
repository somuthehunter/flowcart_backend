import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BrandService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentMerchant } from '../../common/decorators/current-merchant.decorator';

@ApiTags('Brands')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('brands')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Get('suggestions')
  @ApiOperation({ summary: 'Get brand suggestions based on search text' })
  async getSuggestions(
    @Query('q') query: string,
    @CurrentMerchant('id') merchantId: string,
  ) {
    const brands = await this.brandService.getSuggestions(query, merchantId);
    return {
      success: true,
      data: brands,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new brand' })
  @ApiResponse({ status: 201, description: 'Brand created successfully' })
  @ApiResponse({ status: 409, description: 'Brand name already exists' })
  async create(
    @Body() dto: CreateBrandDto,
    @CurrentMerchant('id') merchantId: string,
  ) {
    const brand = await this.brandService.create(dto, merchantId);
    return {
      success: true,
      message: 'Brand created successfully.',
      data: brand,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated list of brands' })
  @ApiResponse({ status: 200, description: 'Paginated lists returned' })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @CurrentMerchant('id') merchantId: string,
  ) {
    const result = await this.brandService.findAll(merchantId, paginationDto);
    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get brand details by ID including associated products' })
  @ApiResponse({ status: 200, description: 'Brand details returned' })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentMerchant('id') merchantId: string,
  ) {
    const brand = await this.brandService.findOne(id, merchantId);
    return {
      success: true,
      data: brand,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update brand details' })
  @ApiResponse({ status: 200, description: 'Brand updated successfully' })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  @ApiResponse({ status: 409, description: 'Brand name already exists' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBrandDto,
    @CurrentMerchant('id') merchantId: string,
  ) {
    const brand = await this.brandService.update(id, dto, merchantId);
    return {
      success: true,
      message: 'Brand updated successfully.',
      data: brand,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete a brand' })
  @ApiResponse({ status: 200, description: 'Brand deleted successfully' })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  async remove(
    @Param('id') id: string,
    @CurrentMerchant('id') merchantId: string,
  ) {
    await this.brandService.delete(id, merchantId);
    return {
      success: true,
      message: 'Brand deleted successfully.',
    };
  }
}
