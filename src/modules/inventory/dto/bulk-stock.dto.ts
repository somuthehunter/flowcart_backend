import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AdjustStockDto } from './adjust-stock.dto';

export class BulkStockDto {
  @ApiProperty({ type: [AdjustStockDto], description: 'Array of stock adjustments' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdjustStockDto)
  adjustments: AdjustStockDto[];
}
