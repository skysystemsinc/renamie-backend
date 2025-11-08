import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Metadata, MetadataSchema } from './metadata.schema';

export type FilesDocument = Files & Document;

export enum FileStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  PROCESSING = 'processing',
  FAILED = 'failed',
  DELETED = 'deleted'
}

@Schema({ timestamps: true })
export class Files {
  @Prop({ required: true })
  name: string;

  @Prop()
  newName: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ required: true })
  size: number;

  @Prop({ required: true })
  url: string;

  @Prop({
    required: true,
    enum: FileStatus,
    default: FileStatus.PENDING,
  })
  status: FileStatus;

  @Prop({ type: [MetadataSchema], default: [] })
  metadata: Metadata[];

  @Prop({ type: Date, default: null })
  rename_at: Date | null;

  @Prop()
  batchId: string;

  @Prop({ type: String, default: '' })
  invoiceId: string;

  @Prop({ type: String, default: '' })
  invoiceDate: string;
  
   @Prop({ type: String, default: null })
  reason: string | null;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  
  @Prop({ type: Date, default: null })
  deletedAt: Date | null;

}

export const FilesSchema = SchemaFactory.createForClass(Files);
