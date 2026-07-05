import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'merchant@example.com', description: 'Merchant email' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPassword@123', description: 'Merchant password' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}
