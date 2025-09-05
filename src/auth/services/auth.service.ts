import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../users/services/user.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { randomBytes } from 'crypto';
import { MailService } from '../../common/services/mailer.service';
import { EmailVerifyDto } from '../dto/verify-email.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
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

    await this.userService.updateLastLogin(user._id);

    const tokens = await this.generateTokens(user);
    await this.userService.updateRefreshToken(user._id, tokens.refreshToken);

    return {
      user,
      ...tokens,
    };
  }

  async register(registerDto: RegisterDto) {
    const user = await this.userService.create(registerDto);
    const { password, ...result } = (user as UserDocument).toObject();

    const tokens = await this.generateTokens(result);
    await this.userService.updateRefreshToken(
      (user as UserDocument)._id as string,
      tokens.refreshToken,
    );

    const verificationHash = randomBytes(10).toString('hex');
    console.log('verificationHash', verificationHash);
    await this.userService.setEmailVerificationHash(
      (user as UserDocument)._id as string,
      verificationHash,
    );
    const appUrl = process.env.Localhost;
    const verifyUrl = `${appUrl}/renamie.com/verify/${verificationHash}`;
    // console.log('verifyUrl', verifyUrl);
    await this.mailService.sendVerificationEmail(result.email, verifyUrl);
    return {
      user: result,
      ...tokens,
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
    const payload = { email: user.email, sub: user._id, role: user.role };

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
    return {
      user,
    };
  }
}
