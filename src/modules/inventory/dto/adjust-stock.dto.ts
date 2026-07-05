import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StockTransactionType } from '../entities/stock-ledger.entity';

export class AdjustStockDto {
  @ApiProperty({ example: 'a1b2c3d4-...', description: 'Product UUID' })
  @IsNotEmpty()
  @IsUUID()
  product_id: string;

  @ApiProperty({ example: 50, description: 'Quantity to adjust. Use positive for addition, negative for reduction.' })
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiProperty({ example: 'PURCHASE', enum: StockTransactionType, description: 'Type of stock transaction' })
  @IsNotEmpty()
  @IsEnum(StockTransactionType)
  transaction_type: StockTransactionType;

  @ApiPropertyOptional({ example: 'PO-12345', description: 'Reference ID (e.g., Bill ID, PO ID)' })
  @IsOptional()
  @IsString()
  reference_id?: string | null;

  @ApiPropertyOptional({ example: 'Restock from vendor X', description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string | null;
}
