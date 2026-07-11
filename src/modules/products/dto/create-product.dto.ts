import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  Min,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductBrandDto {
  @ApiProperty({ example: 'MDH', description: 'Name of the brand' })
  @IsNotEmpty()
  @IsString()
  brand_name: string;

  @ApiProperty({ example: 65.00, description: 'Selling price for this brand' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  selling_price: number;

  @ApiPropertyOptional({ example: 50.00, description: 'Purchase price for this brand' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  purchase_price?: number;

  @ApiPropertyOptional({ example: 'SKU-MDH-100', description: 'SKU for this brand' })
  @IsOptional()
  @IsString()
  sku?: string;
}


export class CreateProductDto {
  @ApiPropertyOptional({ example: 'b3e0d86c-482a-464a-a035-71bb484d59f7', description: 'Category UUID reference' })
  @IsOptional()
  @IsUUID()
  category_id?: string | null;

  @ApiProperty({ example: 'Rice', description: 'English name of the product' })
  @IsNotEmpty()
  @IsString()
  english_name: string;

  @ApiPropertyOptional({ example: 'চাল', description: 'Bengali name of the product' })
  @IsOptional()
  @IsString()
  bengali_name?: string | null;

  @ApiPropertyOptional({ example: 'Long grain aromatic rice', description: 'Detailed description of the product' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: 'KG', default: 'KG', description: 'Measurement unit of the product (e.g. KG, LTR, PCS)' })
  @IsOptional()
  @IsString()
  unit?: string = 'KG';

  @ApiPropertyOptional({ example: 65.00, description: 'Base price of the product without any brand variations' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  base_price?: number | null;

  @ApiProperty({ type: [CreateProductBrandDto], description: 'List of brands for this product', required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductBrandDto)
  brands?: CreateProductBrandDto[] = [];

  @ApiPropertyOptional({ example: true, default: false, description: 'Whether to track stock inventory' })
  @IsOptional()
  @IsBoolean()
  track_stock?: boolean = false;

  @ApiPropertyOptional({ example: 100, default: 0, description: 'Current available stock inventory' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  current_stock?: number = 0;

  @ApiPropertyOptional({ example: 10, default: 0, description: 'Minimum safety stock threshold' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minimum_stock?: number = 0;

  @ApiPropertyOptional({ example: 500, default: 0, description: 'Maximum stock limit' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maximum_stock?: number = 0;

  @ApiPropertyOptional({ example: 'https://example.com/rice.png', description: 'Product image URL link' })
  @IsOptional()
  @IsString()
  image_url?: string | null;
}
