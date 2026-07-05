import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentMerchant } from '../../common/decorators/current-merchant.decorator';

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product category' })
  @ApiResponse({ status: 210, description: 'Category created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Category name already exists' })
  async create(
    @Body() dto: CreateCategoryDto,
    @CurrentMerchant('id') merchantId: string,
  ) {
    const category = await this.categoryService.create(dto, merchantId);
    return {
      success: true,
      message: 'Category created successfully.',
      data: category,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get list of all merchant categories' })
  @ApiResponse({ status: 200, description: 'List of categories' })
  async findAll(@CurrentMerchant('id') merchantId: string) {
    const categories = await this.categoryService.findAll(merchantId);
    return {
      success: true,
      data: categories,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({ status: 200, description: 'Category details returned' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentMerchant('id') merchantId: string,
  ) {
    const category = await this.categoryService.findOne(id, merchantId);
    return {
      success: true,
      data: category,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete a category' })
  @ApiResponse({ status: 200, description: 'Category deleted' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async remove(
    @Param('id') id: string,
    @CurrentMerchant('id') merchantId: string,
  ) {
    await this.categoryService.delete(id, merchantId);
    return {
      success: true,
      message: 'Category deleted successfully.',
    };
  }
}
