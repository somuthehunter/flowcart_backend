import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Pritam Dutta', description: 'Owner name of the merchant' })
  @IsNotEmpty()
  @IsString()
  owner_name: string;

  @ApiProperty({ example: '9876543210', description: 'Contact phone number' })
  @IsNotEmpty()
  @IsString()
  phone_number: string;

  @ApiProperty({ example: 'merchant@example.com', description: 'Email address (used for login)' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPassword@123', description: 'Password (min 6 characters)' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long.' })
  password: string;

  @ApiProperty({ example: 'Pritam Grocery', description: 'Name of the merchant shop' })
  @IsNotEmpty()
  @IsString()
  shop_name: string;

  @ApiProperty({ example: 'GROCERY', description: 'Merchant shop category/type' })
  @IsNotEmpty()
  @IsString()
  shop_type: string;
}
