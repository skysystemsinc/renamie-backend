import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ default: UserRole.USER })
  role: UserRole;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLoginAt?: Date;

  @Prop()
  refreshToken?: string;

  @Prop()
  stripeCustomerId?: string;

  @Prop()
  emailVerificationHash?: string;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop()
  emailVerifiedAt?: Date;

  // property for folder count
  @Prop({ default: false })
  folderCount: number;

  @Prop({ default: false })
  fileCount: number;

  @Prop({ default: false })
  userCount: number;

  //
  @Prop({ default: false })
  isCollaborator?: boolean;

  @Prop()
  inviteAccepted?: boolean;

  @Prop()
  inviteSentAt?: Date;

  @Prop()
  inviteAcceptedAt?: Date;

  // userId  self  relation
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  // is email sent
  @Prop({ default: false })
  emailNotification?: boolean;

  // is email sent
  @Prop({ default: false })
  isSubscriptionCancelled?: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
