import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { DataSource, IsNull, MoreThan } from 'typeorm';
import { MerchantRepository } from '../merchants/merchant.repository';
import { RefreshTokenRepository } from '../refresh-tokens/refresh-token.repository';
import { UserRepository } from '../users/user.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Merchant } from '../merchants/merchant.entity';
import { User } from '../users/user.entity';
import { RefreshToken } from '../refresh-tokens/refresh-token.entity';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly merchantRepository: MerchantRepository,
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async generateTokens(user: User) {
    const payload = {
      id: user.merchant_id || user.id, // For backwards compatibility if merchant_id is used as 'id' in decorators
      userId: user.id,
      merchantId: user.merchant_id,
      email: user.email,
      role: user.role,
    };

    // Access Token valid for 15 minutes
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET || 'supersecretjwtkey123!@#',
      expiresIn: '15m',
    });

    // Refresh Token (secure random string) valid for 30 days
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    return {
      accessToken,
      rawRefreshToken,
      refreshTokenHash,
      expiresAt,
    };
  }

  async register(dto: RegisterDto, ipAddress: string) {
    return this.dataSource.transaction(async (manager) => {
      const transMerchantRepo = manager.getRepository(Merchant);
      const transUserRepo = manager.getRepository(User);
      const transRefreshTokenRepo = manager.getRepository(RefreshToken);

      // Check email uniqueness
      const existingEmail = await transUserRepo.findOne({ where: { email: dto.email } });
      if (existingEmail) {
        throw new ConflictException('Email already registered.');
      }

      // Check phone number uniqueness (in merchants table)
      const existingPhone = await transMerchantRepo.findOne({ where: { phone_number: dto.phone_number } });
      if (existingPhone) {
        throw new ConflictException('Phone number already registered.');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      // Create Merchant
      const merchant = transMerchantRepo.create({
        owner_name: dto.owner_name,
        phone_number: dto.phone_number,
        shop_name: dto.shop_name,
        shop_type: dto.shop_type,
      });
      await transMerchantRepo.save(merchant);
      merchant.created_by = merchant.id;
      merchant.updated_by = merchant.id;
      await transMerchantRepo.save(merchant);

      // Create User
      const user = transUserRepo.create({
        email: dto.email,
        password: hashedPassword,
        role: UserRole.MerchantOwner,
        merchant_id: merchant.id,
        created_by: merchant.id,
        updated_by: merchant.id,
      });
      await transUserRepo.save(user);

      // Generate Tokens
      const { accessToken, rawRefreshToken, refreshTokenHash, expiresAt } =
        await this.generateTokens(user);

      // Save Refresh Token
      const token = transRefreshTokenRepo.create({
        user_id: user.id,
        token_hash: refreshTokenHash,
        expires_at: expiresAt,
        ip_address: ipAddress,
        created_by: user.id,
        updated_by: user.id,
      });
      await transRefreshTokenRepo.save(token);

      const { password, ...userProfile } = user;

      return {
        user: userProfile,
        merchant,
        accessToken,
        refreshToken: rawRefreshToken,
      };
    });
  }

  async login(dto: LoginDto, ipAddress: string) {
    return this.dataSource.transaction(async (manager) => {
      const transUserRepo = manager.getRepository(User);
      const transRefreshTokenRepo = manager.getRepository(RefreshToken);

      const user = await transUserRepo.findOne({
        where: { email: dto.email },
        relations: { merchant: true },
      });
      if (!user) {
        throw new UnauthorizedException('Invalid credentials.');
      }

      const isPasswordValid = await bcrypt.compare(dto.password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials.');
      }

      // Generate Tokens
      const { accessToken, rawRefreshToken, refreshTokenHash, expiresAt } =
        await this.generateTokens(user);

      // Save Refresh Token
      const token = transRefreshTokenRepo.create({
        user_id: user.id,
        token_hash: refreshTokenHash,
        expires_at: expiresAt,
        ip_address: ipAddress,
        created_by: user.id,
        updated_by: user.id,
      });
      await transRefreshTokenRepo.save(token);

      const { password, ...userProfile } = user;

      return {
        user: userProfile,
        merchant: user.merchant,
        accessToken,
        refreshToken: rawRefreshToken,
      };
    });
  }

  async refresh(rawToken: string, ipAddress: string) {
    return this.dataSource.transaction(async (manager) => {
      const transRefreshTokenRepo = manager.getRepository(RefreshToken);
      const hashed = this.hashToken(rawToken);

      const activeToken = await transRefreshTokenRepo.findOne({
        where: {
          token_hash: hashed,
          revoked_at: IsNull(),
          expires_at: MoreThan(new Date()),
        },
        relations: { user: { merchant: true } },
      });

      if (!activeToken) {
        throw new UnauthorizedException('Invalid, expired, or revoked refresh token.');
      }

      const user = activeToken.user;

      // Rotate Refresh Token: Revoke the current token immediately
      activeToken.revoked_at = new Date();
      activeToken.updated_by = user.id;
      await transRefreshTokenRepo.save(activeToken);

      // Generate a new pair of tokens
      const { accessToken, rawRefreshToken, refreshTokenHash, expiresAt } =
        await this.generateTokens(user);

      // Save new Refresh Token
      const newToken = transRefreshTokenRepo.create({
        user_id: user.id,
        token_hash: refreshTokenHash,
        expires_at: expiresAt,
        ip_address: ipAddress,
        created_by: user.id,
        updated_by: user.id,
      });
      await transRefreshTokenRepo.save(newToken);

      return {
        accessToken,
        refreshToken: rawRefreshToken,
      };
    });
  }

  async logout(rawToken: string) {
    const hashed = this.hashToken(rawToken);
    const activeToken = await this.refreshTokenRepository.findActiveByHash(hashed);
    if (activeToken) {
      await this.refreshTokenRepository.revoke(activeToken.id);
    }
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    const { password, ...profile } = user;
    return profile;
  }
}
