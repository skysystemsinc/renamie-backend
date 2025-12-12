import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../users/services/user.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { UserDocument } from '../../users/schemas/user.schema';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';

import {
  EmailVerifyDto,
  resetPasswordDto,
  updatePasswordDto,
} from '../dto/verify-email.dto';
import { SubscriptionService } from '../../subscriptions/services/subscription.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import { SendgridService } from 'src/common/services/sendgrid';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';
import { StripeService } from 'src/stripe/stripe.service';
import {
  CreateInvitedUserDto,
  UserNotificationDto,
} from 'src/users/dto/create-user.dto';
import { randomGenerator } from 'src/utils/helper';
import { SSEService } from 'src/sse/services/sse.service';

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
    private readonly stripeService: StripeService,
    private readonly sseService: SSEService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Account not found!');
    }
    if (user && (await this.userService.validatePassword(user, password))) {
      const { password, ...result } = (user as UserDocument).toObject();
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid Credentials');
    }
    if (user && user?.isCollaborator && !user?.inviteAccepted) {
      throw new UnauthorizedException('Please Accept The Invitation.');
    }
    if (
      user &&
      user?.isCollaborator &&
      user?.emailVerified &&
      user?.inviteAccepted &&
      user?.isSubscriptionCancelled
    ) {
      throw new UnauthorizedException(
        'Your access has been restricted because the owner’s subscription is no longer active.',
      );
    }
    if (user && !user?.emailVerified) {
      throw new UnauthorizedException('Please Verify Your Email.');
    }
    await this.userService.updateLastLogin(user._id);
    // const subscription = await this.subscriptionService.findByUserId(user._id);
    const subscription =
      await this.subscriptionService.findUserActiveOrTrialingSubs(user?._id);
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
    const verifyUrl = `${appUrl}/renamie.com/verify/${verificationHash}`;
    // console.log('result',)
    try {
      await this.sendgridService.sendVerificationEmail(
        result.email,
        result.firstName,
        verifyUrl,
      );
    } catch (error) {
      console.log('email sending error', error);
    }
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
    const verifyUrl = `${appUrl}/renamie.com/resetPassword/${userId}`;
    try {
      await this.sendgridService.sendResetPasswordEmail(
        user?.email,
        user?.firstName,
        verifyUrl,
      );
    } catch (error) {
      console.log('emial sending error', error);
    }

    return user;
  }

  async updatePassword(updatePasswordDto: updatePasswordDto) {
    const user = await this.userService.findById(updatePasswordDto.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (updatePasswordDto?.currentPassword) {
      const matchPass = await this.userService.validatePassword(
        user,
        updatePasswordDto.currentPassword,
      );
      if (!matchPass) {
        throw new UnauthorizedException('Current password is incorrect');
      }
    }
    const updatedUser = await this.userService.update(
      updatePasswordDto.userId,
      {
        password: updatePasswordDto.newPassword,
      },
    );
    const appUrl = process.env.FRONTEND_URL;
    const loginUrl = `${appUrl}/login`;
    if (updatedUser) {
      if (!updatePasswordDto?.currentPassword) {
        try {
          await this.sendgridService.sendPasswordChangedEmail(
            updatedUser?.email,
            updatedUser?.firstName,
            loginUrl,
          );
        } catch (error) {
          console.log('err', error);
        }
      }

      return {
        message: 'Password updated successfully!',
        user: updatedUser,
      };
    }
  }

  // update profile
  async changeUserProfile(userId: string, updateUserDto: UpdateUserDto) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User Not Found');
    }
    const updatedUser = await this.userService.updateProfile(
      userId,
      updateUserDto,
    );
    if (updatedUser?.stripeCustomerId) {
      let customerId = updatedUser?.stripeCustomerId;
      await this.stripeService.updateStripeCustomer(customerId, {
        email: updatedUser?.email,
        name: `${updatedUser.firstName} ${updatedUser.lastName}`,
      });
    }
    return updatedUser;
  }

  // invite user
  async createInvitedUser(
    userId: string,
    createInvitedUserDto: CreateInvitedUserDto,
  ) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const activeSubs = await this.subscriptionService.getUsage(userId);
    const usersAllowed = activeSubs?.features?.users;
    if (user?.userCount >= usersAllowed) {
      throw new BadRequestException(
        'You have reached the maximum number of collaborators allowed in your current plan.',
      );
    }

    const parentId = (user as any)?._id;
    const password = randomGenerator();
    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      ...createInvitedUserDto,
      password: hashedPassword,
      isCollaborator: true,
      inviteAccepted: false,
      emailVerified: true,
      inviteSentAt: new Date(),
      userId: parentId,
    };

    await this.userService.checkIfAlreadyExist(userData?.email);
    const result = await this.userService.createInviteUser(userData);
    if (result) {
      const id = (result as any)?._id.toString();
      await this.userService.updateUser(userId, {
        userCount: user?.userCount + 1,
      });

      await this.firebaseService.createUser(id, {
        id: id,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
        role: result.role,
        createdAt: new Date().toISOString(),
      });

      const appUrl = process.env.FRONTEND_URL;
      const invitationUrl = `${appUrl}/renamie.com/invite/${id}`;
      await this.sendgridService.sendInviteEmail(
        result?.email,
        result?.firstName,
        user?.firstName,
        invitationUrl,
      );
    }
    return result;
  }

  // get Collaborators

  async getCollaborators(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const collaborators =
      await this.userService.findCollaboratorsByParentId(userId);
    return collaborators;
  }

  // accept Invite
  async acceptInvite(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const collaborators =
      await this.userService.acceptCollaboratorInvitation(userId);
    return collaborators;
  }

  // removeCollaborator

  async removeCollaborator(userId: string, id: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const collaboartor = await this.userService.findById(id);
    if (!collaboartor) {
      throw new NotFoundException('Collaborator not found');
    }

    await this.userService.removeCollaborators(id);
    this.sseService.sendLogout(id);
    await this.userService.updateUser(userId, {
      userCount: user?.userCount - 1,
    });

    return collaboartor;
  }

  // user notifications
  async userNotifications(
    userId: string,
    userNotificationDto: UserNotificationDto,
  ) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return await this.userService.SaveEmailNotification(
      userId,
      userNotificationDto?.emailNotification,
    );
  }

  // get login user by id

  async getUserById(id: string) {
    const user = await this.userService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
