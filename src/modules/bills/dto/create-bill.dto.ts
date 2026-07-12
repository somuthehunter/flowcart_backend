import {
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsOptional,
  IsUUID,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBillItemDto {
  @ApiProperty({ example: 'd7486e0c-d55e-4efb-8664-df8f5f6b2111', description: 'Product UUID' })
  @IsNotEmpty()
  @IsUUID()
  product_id: string;

  @ApiPropertyOptional({ example: '87486e0c-d55e-4efb-8664-df8f5f6b2222', description: 'Brand UUID' })
  @IsOptional()
  @IsUUID()
  brand_id?: string;

  @ApiProperty({ example: 2.5, description: 'Quantity purchased (supports decimals for weight-based units)' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.001)
  quantity: number;
}

export class CreateBillDto {
  @ApiProperty({ type: [CreateBillItemDto], description: 'List of items in this checkout session' })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBillItemDto)
  items: CreateBillItemDto[];

  @ApiPropertyOptional({ example: 'John Doe', description: 'Name of the customer' })
  @IsOptional()
  @IsString()
  customer_name?: string;

  @ApiPropertyOptional({ example: '+1234567890', description: 'Mobile number of the customer' })
  @IsOptional()
  @IsString()
  customer_mobile?: string;

  @ApiPropertyOptional({ example: 5.00, default: 0, description: 'Tax amount added to checkout' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tax_amount?: number = 0;

  @ApiPropertyOptional({ example: 10.00, default: 0, description: 'Discount amount deducted from checkout' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount_amount?: number = 0;

  @ApiPropertyOptional({ example: 'PAID', description: 'Status of the payment' })
  @IsOptional()
  @IsString()
  payment_status?: string;
}
