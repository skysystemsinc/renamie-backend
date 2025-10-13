import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Files, FilesSchema } from './files.schema';

export type FolderDocument = Folder & Document;

@Schema({ timestamps: true })
export class Folder {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true})
  name: string;

  @Prop({ type: [FilesSchema], default: [] })
  files: Files[];

  @Prop({ type: [String], default: [] })
  emailSentBatches: string[];
}

export const FolderSchema = SchemaFactory.createForClass(Folder);
