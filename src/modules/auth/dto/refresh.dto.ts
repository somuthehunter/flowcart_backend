import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshDto {
  @ApiProperty({ description: 'The refresh token string generated on register/login' })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}
