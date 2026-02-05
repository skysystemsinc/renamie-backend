import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
// export class Book {
//   @Prop({ required: true })
//   vendorName: string;

//   @Prop({ required: true })
//   paymentAccount: string;

//   @Prop({ required: true })
//   paymentMethod: string;

//   @Prop()
//   description?: string;

//   @Prop({ required: true })
//   customerName: string;

//   @Prop({ required: true })
//   product: string;

//   @Prop({ required: true })
//   discount: string;

//   @Prop()
//   expense: number;

//   @Prop()
//   bill: number;

//   @Prop({ required: true })
//   transactionType: string;

//   @Prop()
//   vendorNetTerm: number;
// }

export class Book {
  @Prop({ required: false })
  vendorName?: string;

  @Prop({ required: false })
  paymentAccount?: string;

  @Prop({ required: false })
  paymentMethod?: string;

  @Prop({ required: false })
  description?: string;

  @Prop({ required: false })
  customerName?: string;

  @Prop({ required: false })
  product?: string;

  // // DTO uses number → keep number here
  // @Prop({ required: false, type: Number })
  // discount?: number;

  // // Only valid when transactionType === 'Expense' (handled in DTO)
  // @Prop({ required: false, type: Number })
  // expense?: number;

  // // Only valid when transactionType === 'Bill' (handled in DTO)
  // @Prop({ required: false, type: Number })
  // bill?: number;

  @Prop({ required: false })
  transactionType?: string;

  @Prop({ required: false, type: Number })
  vendorNetTerm?: number;
}


export const BookSchema = SchemaFactory.createForClass(Book);
