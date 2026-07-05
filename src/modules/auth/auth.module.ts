import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Merchant } from '../merchants/merchant.entity';
import { MerchantRepository } from '../merchants/merchant.repository';
import { RefreshToken } from '../refresh-tokens/refresh-token.entity';
import { RefreshTokenRepository } from '../refresh-tokens/refresh-token.repository';
import { User } from '../users/user.entity';
import { UserRepository } from '../users/user.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Merchant, RefreshToken, User]),
    JwtModule.register({
      global: true,
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    MerchantRepository,
    RefreshTokenRepository,
    UserRepository,
  ],
  exports: [AuthService, MerchantRepository, RefreshTokenRepository, UserRepository, JwtModule],
})
export class AuthModule {}
