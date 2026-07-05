import {
  Controller,
  Post,
  Get,
  Body,
  Ip,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentMerchant } from '../../common/decorators/current-merchant.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user and merchant profile' })
  @ApiResponse({ status: 201, description: 'User and Merchant registered successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Email or phone number already in use' })
  async register(
    @Body() dto: RegisterDto,
    @Ip() ip: string,
  ) {
    const data = await this.authService.register(dto, ip);
    return {
      success: true,
      message: 'User registered successfully.',
      data,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user credentials' })
  @ApiResponse({ status: 200, description: 'Credentials verified and tokens issued' })
  @ApiResponse({ status: 401, description: 'Invalid login credentials' })
  async login(
    @Body() dto: LoginDto,
    @Ip() ip: string,
  ) {
    const data = await this.authService.login(dto, ip);
    return {
      success: true,
      message: 'Login successful.',
      data,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a new access token via refresh token rotation (RTR)' })
  @ApiResponse({ status: 200, description: 'Tokens successfully rotated' })
  @ApiResponse({ status: 401, description: 'Refresh token is expired, invalid, or revoked' })
  async refresh(
    @Body() dto: RefreshDto,
    @Ip() ip: string,
  ) {
    const data = await this.authService.refresh(dto.refreshToken, ip);
    return data;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke the merchant refresh token' })
  @ApiResponse({ status: 200, description: 'Refresh token revoked' })
  async logout(@Body() dto: RefreshDto) {
    await this.authService.logout(dto.refreshToken);
    return {
      success: true,
      message: 'Logged out successfully.',
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current logged-in user profile details' })
  @ApiResponse({ status: 200, description: 'Profile returned' })
  @ApiResponse({ status: 401, description: 'Access token is missing, expired, or invalid' })
  async getProfile(@CurrentMerchant('userId') userId: string) {
    const profile = await this.authService.getProfile(userId);
    return {
      success: true,
      data: profile,
    };
  }
}
