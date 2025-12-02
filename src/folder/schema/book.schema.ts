import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class Book {
  @Prop({ required: true })
  vendorName: string;

  @Prop({ required: true })
  paymentAccount: string;

  @Prop({ required: true })
  paymentMethod: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  customerName: string;

  @Prop({ required: true })
  product: string;

  @Prop({ required: true })
  discount: string;

  @Prop()
  expense: number;

  @Prop()
  bill: number;

  @Prop({ required: true })
  transactionType: string;

  @Prop({ required: true })
  vendorNetTerm: number;
}

export const BookSchema = SchemaFactory.createForClass(Book);
