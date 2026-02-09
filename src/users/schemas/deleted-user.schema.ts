import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DeletedUserDocument = DeletedUser & Document;

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Schema({ timestamps: true, collection: 'deleted_users' })
export class DeletedUser {
  @Prop({ required: true })
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

  @Prop({ required: true, default: false })
  termsConditions: boolean;

  // Privacy Policy accepted
  @Prop({ required: true, default: false })
  privacyPolicy: boolean;

  @Prop({ default: false})
  selectedForDowngrade?: boolean;

  // Deletion tracking fields
  @Prop({ type: Types.ObjectId, required: true })
  originalUserId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  parentUserId: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  deletedAt: Date;

  @Prop({ type: String })
  deletedReason?: string;
}

export const DeletedUserSchema = SchemaFactory.createForClass(DeletedUser);
