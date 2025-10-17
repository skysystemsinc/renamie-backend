import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Folder, FolderDocument } from '../schema/folder.schema';

@Injectable()
export class FolderRepository {
  constructor(
    @InjectModel(Folder.name) private folderModel: Model<FolderDocument>,
  ) {}

  async create(FolderDocument: Partial<Folder>): Promise<FolderDocument> {
    const createdFolder = new this.folderModel(FolderDocument);
    return createdFolder.save();
  }

  async findByNameAndUserId(
    name: string,
    userId: string,
  ): Promise<FolderDocument | null> {
    return this.folderModel.findOne({
      name,
      userId: new Types.ObjectId(userId),
    });
  }

  async update(id: string, name: string): Promise<FolderDocument | null> {
    return this.folderModel
      .findByIdAndUpdate(id, { name }, { new: true })
      .exec();
  }

  async findById(id: string): Promise<FolderDocument | null> {
    return this.folderModel.findById(id).exec();
  }

  async delete(id: string): Promise<FolderDocument | null> {
    return this.folderModel.findByIdAndDelete(id).exec();
  }

  async findAllByUserId(userId: string): Promise<FolderDocument[]> {
    return this.folderModel.find({ userId: new Types.ObjectId(userId) }).exec();
  }

  //  find file
  async findFileById(fileId: string): Promise<any | null> {
    const folder = await this.folderModel.findOne(
      { 'files._id': new Types.ObjectId(fileId) },
      { 'files.$': 1 },
    );
    if (!folder || !folder.files || folder.files.length === 0) return null;
    return folder.files[0];
  }

  // update file data
  async updateFileData(
    fileId: string,
    updates: { newName?: string; url?: string; rename_at?: Date },
  ): Promise<void> {
    await this.folderModel.updateOne(
      { 'files._id': new Types.ObjectId(fileId) },
      {
        $set: {
          ...(updates.newName && { 'files.$.newName': updates.newName }),
          ...(updates.url && { 'files.$.url': updates.url }),
          ...(updates.rename_at && { 'files.$.rename_at': updates.rename_at }),
        },
      },
    );
  }

  // folder with paginated files
  async getPaginatedFiles(
    folderId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    folderId: string;
    name: string;
    files: any[];
    totalFiles: number;
  }> {
    const skip = (page - 1) * limit;

    const folder = await this.folderModel
      .aggregate([
        { $match: { _id: new Types.ObjectId(folderId) } },
        {
          $project: {
            _id: 1,
            name: 1,
            totalFiles: { $size: '$files' },
            files: { $slice: [{ $reverseArray: '$files' }, skip, limit] },
          },
        },
      ])
      .exec();

    if (!folder || folder.length === 0) {
      return { folderId: folderId, name: '', files: [], totalFiles: 0 };
    }
    const result = folder[0];

    return {
      folderId: result._id.toString(),
      name: result.name,
      files: result.files,
      totalFiles: result.totalFiles,
    };
  }
}
