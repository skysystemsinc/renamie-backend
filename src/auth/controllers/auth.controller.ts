import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { AuthService } from '../services/auth.service';
import { User } from '../../users/schemas/user.schema';
import { LoginDto } from '../dto/login.dto';

interface AuthenticatedRequest extends ExpressRequest {
  user: User & { _id: string };
}
import { RegisterDto } from '../dto/register.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { ApiBody } from '@nestjs/swagger';
import { EmailVerifyDto } from '../dto/verify-email.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return ApiResponseDto.success('User registered successfully', result);
  }

  @ApiBody({ type: LoginDto })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  async login(@Body() loginDto: LoginDto, @Request() req: ExpressRequest) {
    console.log('loginDto', loginDto);
    const result = await this.authService.login(loginDto);
    return ApiResponseDto.success('Login successful', result);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    const result = await this.authService.refreshToken(refreshTokenDto);
    return ApiResponseDto.success('Token refreshed successfully', result);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(@Request() req: AuthenticatedRequest) {
    await this.authService.logout(req.user._id);
    return ApiResponseDto.success('Logged out successfully');
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() emailVerifyDto: EmailVerifyDto) {
    const result = await this.authService.verifyEmail(emailVerifyDto);
    return ApiResponseDto.success('Email verified successfully!', result);
  }
}
