import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { CreateInviteUserDataDto, CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UserRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).select('-refreshToken').exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();
  }

  async delete(id: string): Promise<User | null> {
    return this.userModel.findByIdAndDelete(id).exec();
  }

  async updateRefreshToken(id: string, refreshToken: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { refreshToken }).exec();
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(id, { lastLoginAt: new Date() })
      .exec();
  }

  async setEmailVerificationHash(id: string, hash: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(id, { emailVerificationHash: hash })
      .exec();
  }

  async findByVerificationHash(hash: string): Promise<User | null> {
    return this.userModel.findOne({ emailVerificationHash: hash }).exec();
  }

  async verifyEmail(id: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(id, {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationHash: null,
      })
      .exec();
  }

  // create collaborator
  async createInvite(
    createInviteUserDataDto: CreateInviteUserDataDto,
  ): Promise<User> {
    const createdUser = new this.userModel(createInviteUserDataDto);
    return createdUser.save();
  }

  async findCollaboratorsByParentId(parentId: string): Promise<User[]> {
    return this.userModel
      .find({
        userId: new Types.ObjectId(parentId),
        isCollaborator: true,
      })
      .select(
        'firstName lastName email inviteAccepted inviteAcceptedAt isCollaborator inviteSentAt',
      )
      .sort({ createdAt: -1 })
      .exec();
  }

  //
  async findUserByIdAndAcceptInvite(userId: string) {
    await this.userModel
      .findByIdAndUpdate(userId, {
        inviteAccepted: true,
        inviteAcceptedAt: new Date(),
      })
      .exec();
  }

  //
  async removeUserById(id: string) {
    await this.userModel.findByIdAndDelete(id);
  }

  async findAllPaginated(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ users: User[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const filter = { role: 'user' };
    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments().exec(),
    ]);

    return { users, total, page, limit };
  }
}
