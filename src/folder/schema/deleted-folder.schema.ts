import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Files, FilesSchema } from './files.schema';
import { Book, BookSchema } from './book.schema';

export type DeletedFolderDocument = DeletedFolder & Document;

@Schema({ timestamps: true, collection: 'deleted_folders' })
export class DeletedFolder {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  parentUser?: Types.ObjectId | null;

  @Prop({ required: true })
  name: string;

  @Prop({ type: [FilesSchema], default: [] })
  files: Files[];

  @Prop({ type: [String], default: [] })
  emailSentBatches: string[];

  @Prop({ type: String, default: '' })
  format?: string;

  @Prop({ type: BookSchema })
  book: Book;

  @Prop({ type: Types.ObjectId, required: true })
  originalFolderId: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  deletedAt: Date;

  @Prop({ type: String })
  deletedReason?: string;
}

export const DeletedFolderSchema = SchemaFactory.createForClass(DeletedFolder);