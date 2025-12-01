import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class Book {
  @Prop({ required: true })
  vendorName: string;

  @Prop({ required: true })
  paymentAccount: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  customerName: string;

  @Prop({ required: true })
  product: string;

  @Prop({ required: true })
  discount: string;

  @Prop({ required: true })
  expense: string;

  @Prop({ required: true })
  transactionType: string;

  @Prop({ required: true })
  vendorNetType: string;
}

export const BookSchema = SchemaFactory.createForClass(Book);
