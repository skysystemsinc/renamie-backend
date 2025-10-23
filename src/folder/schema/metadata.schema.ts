// src/payments/schemas/metadata.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MetadataDocument = Metadata & Document;

// @Schema({ timestamps: true })
// export class Metadata {
//   @Prop()
//   address: string;

//   @Prop()
//   street: string;

//   @Prop()
//   city: string;

//   @Prop()
//   state: string;

//   @Prop()
//   zipCode: string;

//   @Prop()
//   name: string;

//   @Prop()
//   addressBlock: string;

//   @Prop()
//   customerNumber: string;

//   @Prop()
//   invoiceReceiptDate: string;

//   @Prop()
//   invoiceReceiptId: string;

//   @Prop()
//   taxPayerId: string;

//   @Prop()
//   orderDate: string;

//   @Prop()
//   paymentTerms: string;

//   @Prop()
//   receiverAddress: string;

//   @Prop()
//   receiverName: string;

//   @Prop()
//   subtotal: string;

//   @Prop()
//   tax: string;

//   @Prop()
//   total: string;

//   @Prop()
//   vendorAddress: string;

//   @Prop()
//   vendorName: string;

//   @Prop()
//   vendorPhone: string;

//   @Prop()
//   vendorUrl: string;

//   @Prop()
//   other: string;
// }

@Schema({ timestamps: true })
export class Metadata {
  @Prop() address: string;
  @Prop() street: string;
  @Prop() city: string;
  @Prop() state: string;
  @Prop() zipCode: string;
  @Prop() addressBlock: string;
  @Prop() name: string;
  @Prop() customerNumber: string;
  @Prop() invoiceReceiptDate: string;
  @Prop() invoiceReceiptId: string;
  @Prop() orderDate: string;
  @Prop() paymentTerms: string;
  @Prop() receiverName: string;
  @Prop() subtotal: string;
  @Prop() total: string;
  @Prop() vendorAddress: string;
  @Prop() vendorName: string;
  @Prop() vendorPhone: string;
  @Prop() vendorUrl: string;
  @Prop() other: string;
}

export const MetadataSchema = SchemaFactory.createForClass(Metadata);
