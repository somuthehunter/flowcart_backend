import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Drinks', description: 'Name of the product category' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;
}
