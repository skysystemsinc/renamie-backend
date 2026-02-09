import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DeletedUser,
  DeletedUserDocument,
} from '../schemas/deleted-user.schema';

@Injectable()
export class DeletedUserRepository {
  constructor(
    @InjectModel(DeletedUser.name)
    private deletedUserModel: Model<DeletedUserDocument>,
  ) {}

  async createDeletedUser(
    userData: any,
    parentUserId: string,
    reason: string = 'downgrade',
  ): Promise<DeletedUser> {
    const deletedUser = new this.deletedUserModel({
      ...userData,
      originalUserId: new Types.ObjectId(userData._id || userData.id),
      parentUserId: new Types.ObjectId(parentUserId),
      deletedAt: new Date(),
      deletedReason: reason,
    });
    return deletedUser.save();
  }

  async createManyDeletedUsers(
    usersData: any[],
    parentUserId: string,
    reason: string = 'downgrade',
  ): Promise<void> {
    const deletedUsers = usersData.map((user) => {
      const userObj = user.toObject ? user.toObject() : user;
      const userId = userObj._id || userObj.id;
      return {
        ...userObj,
        _id: undefined, // Remove original _id to let MongoDB create new one
        originalUserId: new Types.ObjectId(userId),
        parentUserId: new Types.ObjectId(parentUserId),
        deletedAt: new Date(),
        deletedReason: reason,
      };
    });

    if (deletedUsers.length > 0) {
      await this.deletedUserModel.insertMany(deletedUsers);
    }
  }

  async findDeletedUsersByParentId(parentUserId: string): Promise<DeletedUser[]> {
    return this.deletedUserModel
      .find({
        parentUserId: new Types.ObjectId(parentUserId),
      })
      .sort({ deletedAt: -1 })
      .exec();
  }

  async restoreDeletedUser(originalUserId: string): Promise<DeletedUser | null> {
    return this.deletedUserModel
      .findOneAndDelete({
        originalUserId: new Types.ObjectId(originalUserId),
      })
      .exec();
  }

  async findDeletedUserByOriginalId(
    originalUserId: string,
  ): Promise<DeletedUser | null> {
    return this.deletedUserModel
      .findOne({
        originalUserId: new Types.ObjectId(originalUserId),
      })
      .exec();
  }
}

