import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/user.repository';
import { CreateInviteUserDataDto, CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../schemas/user.schema';
// import { StripeService } from 'src/stripe/stripe.service';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(
      createUserDto.email,
    );
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const userData = { ...createUserDto, password: hashedPassword };

    return this.userRepository.create(userData);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.userRepository.update(id, updateUserDto);
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }
    return updatedUser;
  }

  async delete(id: string): Promise<void> {
    const deletedUser = await this.userRepository.delete(id);
    if (!deletedUser) {
      throw new NotFoundException('User not found');
    }
  }

  async updateRefreshToken(id: string, refreshToken: string): Promise<void> {
    await this.userRepository.updateRefreshToken(id, refreshToken);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.updateLastLogin(id);
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  async setEmailVerificationHash(id: string, hash: string): Promise<void> {
    await this.userRepository.setEmailVerificationHash(id, hash);
  }

  async findByVerificationHash(hash: string): Promise<User | null> {
    return this.userRepository.findByVerificationHash(hash);
  }

  async verifyEmail(id: string): Promise<void> {
    await this.userRepository.verifyEmail(id);
  }

  // update profile

  async updateProfile(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const updatedUser = await this.userRepository.update(userId, updateUserDto);
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }
    return updatedUser;
  }

  // update user
  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User | null> {
    const updatedUser = await this.userRepository.update(id, updateUserDto);
    return updatedUser;
  }

  async checkIfAlreadyExist(email: string) {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }
  }

  // create collaboartor
  async createInviteUser(userData: CreateInviteUserDataDto): Promise<User> {
    return this.userRepository.createInvite(userData);
  }

  async findCollaboratorsByParentId(parentId: string) {
    return this.userRepository.findCollaboratorsByParentId(parentId);
  }

  async acceptCollaboratorInvitation(userId: string) {
    return this.userRepository.findUserByIdAndAcceptInvite(userId);
  }

  //
  async removeCollaborators(id: string) {
    return this.userRepository.removeUserById(id);
  }
}
