import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type HistroyDocument = History & Document;

@Schema({ timestamps: true })
export class History {
  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  status: string;
}

export const HistroySchema = SchemaFactory.createForClass(History);
