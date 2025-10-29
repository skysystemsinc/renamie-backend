import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsBoolean,
  IsMongoId,
  IsDate,
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'Email', example: 'test@test.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Password', example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: 'First Name', example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: 'Last Name', example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsOptional()
  @IsString()
  role?: string;
}

export class CreateInvitedUserDto {
  @ApiProperty({ description: 'Email', example: 'test@test.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'First Name', example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: 'Last Name', example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;
}

export class CreateInviteUserDataDto {
  @ApiProperty({ description: 'Email', example: 'test@test.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'First Name', example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: 'Last Name', example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'Is collaborator',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isCollaborator?: boolean;

  @ApiProperty({
    description: 'Invite accepted status',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  inviteAccepted?: boolean;

  @ApiProperty({
    description: 'Invite sent at',
    required: false,
  })
  @IsOptional()
  inviteSentAt?: Date;

  @ApiProperty({
    description: 'Invite accepted at',
    required: false,
  })
  @IsOptional()
  inviteAcceptedAt?: Date;
  //
  @ApiProperty({ description: 'User password (auto-generated and hashed)' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'Parent user ID',
    example: '652fc8d8f1a3d21234567890',
  })
  @IsMongoId()
  @IsNotEmpty()
  userId: string;
}


export class CollaboratorResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  inviteAccepted: boolean;

  @ApiProperty()
  inviteSentAt: Date;

  @ApiProperty()
  inviteAcceptedAt?: Date;

  @ApiProperty()
  isCollaborator: boolean;

  @ApiProperty()
  userId: string;
}
