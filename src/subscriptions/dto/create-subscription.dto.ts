import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsEmail,
  Min,
  IsObject,
  IsArray,
} from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The ID of the plan to subscribe to',
    example: '66d9a4000000000000000000',
  })
  planId: string;

  @IsOptional()
  @IsArray()
  @ApiProperty({
    description: 'The IDs of the folders to subscribe to',
    example: ['66d9a4000000000000000000', '66d9a4000000000000000001'],
    required: false,
  })
  selectedFolderIds?: string[];
}

export class CancelSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'subscription id',
    example: '66d9a4000000000000000000',
  })
  subscriptionId: string;
}
