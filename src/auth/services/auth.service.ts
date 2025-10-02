import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../users/services/user.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { UserDocument } from '../../users/schemas/user.schema';
import { randomBytes } from 'crypto';
import {
  EmailVerifyDto,
  resetPasswordDto,
  updatePasswordDto,
} from '../dto/verify-email.dto';
import { SubscriptionService } from '../../subscriptions/services/subscription.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import { SendgridService } from 'src/common/services/sendgrid';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    // private mailService: MailService,
    private sendgridService: SendgridService,
    private subscriptionService: SubscriptionService,
    private firebaseService: FirebaseService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    if (user && (await this.userService.validatePassword(user, password))) {
      const { password, ...result } = (user as UserDocument).toObject();
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user && !user?.emailVerified) {
      throw new UnauthorizedException('Please verify your email.');
    }
    await this.userService.updateLastLogin(user._id);
    const subscription = await this.subscriptionService.findByUserId(user._id);
    const tokens = await this.generateTokens(user);
    await this.userService.updateRefreshToken(user._id, tokens.refreshToken);

    return {
      user: {
        ...user,
        subscription,
      },
      ...tokens,
    };
  }

  async register(registerDto: RegisterDto) {
    const user = await this.userService.create(registerDto);
    const { password, ...result } = (user as UserDocument).toObject();

    await this.firebaseService.createUser(result._id.toString(), {
      id: result._id.toString(),
      email: result.email,
      firstName: result.firstName,
      lastName: result.lastName,
      role: result.role,
      createdAt: new Date().toISOString(),
    });

    const verificationHash = randomBytes(10).toString('hex');
    await this.userService.setEmailVerificationHash(
      (user as UserDocument)._id as string,
      verificationHash,
    );
    const appUrl = process.env.FRONTEND_URL;
    const verifyUrl = `${appUrl}renamie.com/verify/${verificationHash}`;
    await this.sendgridService.sendVerificationEmail(
      result.email,
      result.firstName,
      verifyUrl,
    );
    return {
      user: result,
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    try {
      const payload = await this.jwtService.verifyAsync(
        refreshTokenDto.refreshToken,
        {
          secret: this.configService.get<string>('jwt.refreshSecret'),
        },
      );

      const user = await this.userService.findById(payload.sub);
      if (!user || user.refreshToken !== refreshTokenDto.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(user);
      await this.userService.updateRefreshToken(
        (user as UserDocument)._id as string,
        tokens.refreshToken,
      );

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    await this.userService.updateRefreshToken(userId, '');
    return { message: 'Logged out successfully' };
  }

  private async generateTokens(user: any) {
    const subscription = await this.subscriptionService.findByUserId(user._id);
    const payload = {
      email: user.email,
      sub: user._id,
      role: user.role,
      subscription: subscription || null,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: this.configService.get<string>('jwt.expiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async verifyEmail(emailVerifyDto: EmailVerifyDto) {
    const { hash } = emailVerifyDto;
    const user = await this.userService.findByVerificationHash(hash);
    if (!user) {
      return { message: 'Invalid Hash' };
    }
    await this.userService.verifyEmail((user as UserDocument)._id as string);
    return user;
  }

  async resetPassword(resetPasswordDto: resetPasswordDto) {
    const user = await this.userService.findByEmail(resetPasswordDto.email);
    if (!user) {
      throw new UnauthorizedException('Email not registered');
    }
    const id = (user as UserDocument)._id as string;
    let userId = id.toString();
    const appUrl = process.env.FRONTEND_URL;
    const verifyUrl = `${appUrl}renamie.com/resetPassword/${userId}`;
    await this.sendgridService.sendResetPasswordEmail(
      user?.email,
      user?.firstName,
      verifyUrl,
    );

    return user;
  }

  async updatePassword(updatePasswordDto: updatePasswordDto) {
    const user = await this.userService.findById(updatePasswordDto.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const updatedUser = await this.userService.update(
      updatePasswordDto.userId,
      {
        password: updatePasswordDto.password,
      },
    );
    const appUrl = process.env.FRONTEND_URL;
    const loginUrl = `${appUrl}login`;
    if (updatedUser) {
      await this.sendgridService.sendPasswordChangedEmail(
        updatedUser?.email,
        updatedUser?.firstName,
        loginUrl,
      );

      return {
        message: 'Password updated successfully!',
        user: updatedUser,
      };
    }
  }
}
