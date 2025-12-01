import { Injectable, Logger } from '@nestjs/common';
import { BaseSeeder, SeederResult } from './base.seeder';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserSeeder extends BaseSeeder {
  private readonly logger = new Logger(UserSeeder.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {
    super();
  }

  async seed(): Promise<SeederResult> {
    try {
      const adminEmail = 'admin@renamie.com';
      const existingAdmin = await this.userModel.findOne({ email: adminEmail });

      if (existingAdmin) {
        return {
          success: true,
          message: 'Admin user already exists',
        };
      }

      const hashedPassword = await bcrypt.hash('Admin123!', 10);

      const adminUser = new this.userModel({
        email: adminEmail,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        isActive: true,
        emailVerified: true,
      });

      await adminUser.save();

      return {
        success: true,
        message: 'Admin user created successfully',
        count: 1,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        success: false,
        message: 'Failed to seed admin user',
        error: error.message,
      };
    }
  }

  async clear(): Promise<SeederResult> {
    try {
      const result = await this.userModel.deleteMany({ role: UserRole.ADMIN });
      return {
        success: true,
        message: `Deleted ${result.deletedCount} admin users`,
        count: result.deletedCount,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        success: false,
        message: 'Failed to clear admin users',
        error: error.message,
      };
    }
  }
}
