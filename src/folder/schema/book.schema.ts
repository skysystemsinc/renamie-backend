import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class Book {
  @Prop({ required: true })
  vendorName: string;

  @Prop({ required: true })
  paymentAccount: string;

  @Prop()
  description: string;
}

export const BookSchema = SchemaFactory.createForClass(Book);
