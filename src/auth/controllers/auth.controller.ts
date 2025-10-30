import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Get,
  Param,
  Delete,
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
import { ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger';
import {
  EmailVerifyDto,
  resetPasswordDto,
  updatePasswordDto,
} from '../dto/verify-email.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';
import {
  CollaboratorResponseDto,
  CreateInvitedUserDto,
} from 'src/users/dto/create-user.dto';

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

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: resetPasswordDto) {
    const result = await this.authService.resetPassword(resetPasswordDto);
    return ApiResponseDto.success('Email has been sent to you !', result);
  }

  @Post('update-password')
  @HttpCode(HttpStatus.OK)
  async updatePassword(@Body() updatePasswordDto: updatePasswordDto) {
    const result = await this.authService.updatePassword(updatePasswordDto);
    return ApiResponseDto.success('Your password has been updated !', result);
  }

  // get user
  @Post('update-profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async getUser(
    @CurrentUser('id') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const result = await this.authService.changeUserProfile(
      userId,
      updateUserDto,
    );
    return ApiResponseDto.success('user profile updated !', result);
  }

  // create invite user
  @Post('invite-user')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ type: CollaboratorResponseDto })
  async createInviteUser(
    @CurrentUser('id') userId: string,
    @Body() createInvitedUserDto: CreateInvitedUserDto,
  ) {
    const user = await this.authService.createInvitedUser(
      userId,
      createInvitedUserDto,
    );
    return ApiResponseDto.success('Collaborator created successfully', user);
  }

  @Get('invite-accept/:id')
  async updateCollaborator(@Param('id') id: string) {
    const user = await this.authService.acceptInvite(id);
    return ApiResponseDto.success(
      'Invitation accepted successfully! you can now start collaborating.',
      user,
    );
  }

  @Get('collaborators/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async getCollaborators(
    @Param('id') parentId: string,
    @CurrentUser('id') userId: string,
  ) {
    const user = await this.authService.getCollaborators(userId, parentId);
    return ApiResponseDto.success('Collaborator Fetched successfully', user);
  }

  @Delete('remove-collaborator/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ type: CollaboratorResponseDto })
  async removeCollaborator(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    const collaboartor = await this.authService.removeCollaborator(userId, id);
    return ApiResponseDto.success(
      'Collaborator deleted successfully!',
      collaboartor,
    );
  }
}
