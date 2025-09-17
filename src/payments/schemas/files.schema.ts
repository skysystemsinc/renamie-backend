import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FilesDocument = Files & Document;

@Schema({ timestamps: true })
export class Files {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ required: true })
  size: number;

  @Prop({ required: true })
  url: string;
}

export const FilesSchema = SchemaFactory.createForClass(Files);
