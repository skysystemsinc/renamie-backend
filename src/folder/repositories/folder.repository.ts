import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Folder, FolderDocument } from '../schema/folder.schema';
import { format } from 'path';

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
    totalFiles: number;
    format: string;
    files: any[];
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
            format: 1,
            files: { $slice: ['$files', skip, limit] },
          },
        },
      ])
      .exec();

    const result = folder[0];
    return {
      folderId: result._id.toString(),
      name: result.name,
      totalFiles: result.totalFiles,
      format: result.format,
      files: result.files,
    };
  }

  // formate
  async updateFormat(
    folderId: string,
    format: string,
  ): Promise<FolderDocument | null> {
    return this.folderModel
      .findByIdAndUpdate(folderId, { format }, { new: true })
      .exec();
  }

  // get all completed files of a single folder
  async getCompletedFiles(folderId: string): Promise<any[]> {
    const result = await this.folderModel
      .aggregate([
        { $match: { _id: new Types.ObjectId(folderId) } },
        { $unwind: '$files' },
        { $match: { 'files.status': 'completed' } },
        { $project: { _id: 0, file: '$files' } },
      ])
      .exec();

    return result.map((r) => r.file);
  }

  // get completed files of complete module (with pagination)
  async getAllCompletedFiles(
    userId: string,
    page = 1,
    limit = 10,
  ): Promise<{
    files: any[];
    totalFiles: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const result = await this.folderModel.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
        },
      },
      { $unwind: '$files' },
      { $match: { 'files.status': 'completed' } },
      { $sort: { 'files.createdAt': -1 } },
      { $skip: skip },
      { $limit: limit },
      { $project: { _id: 0, file: '$files' } },
    ]);

    // count total completed files for this user
    const totalResult = await this.folderModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      { $unwind: '$files' },
      { $match: { 'files.status': 'completed' } },
      { $count: 'total' },
    ]);

    const totalFiles = totalResult.length > 0 ? totalResult[0].total : 0;

    return {
      files: result.map((r) => r.file),
      totalFiles,
      page,
      limit,
    };
  }

  // get file by folder
  async getFilesByFolder(
    userId: string,
    folderId: string,
    page = 1,
    limit = 10,
  ): Promise<{
    files: any[];
    totalFiles: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;

    const result = await this.folderModel.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          _id: new Types.ObjectId(folderId),
        },
      },
      { $unwind: '$files' },
      { $match: { 'files.status': 'completed' } },
      { $sort: { 'files.createdAt': -1 } },
      { $skip: skip },
      { $limit: limit },
      { $project: { _id: 0, file: '$files' } },
    ]);

    const totalResult = await this.folderModel.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          _id: new Types.ObjectId(folderId),
        },
      },
      { $unwind: '$files' },
      { $match: { 'files.status': 'completed' } },
      { $count: 'total' },
    ]);

    const totalFiles = totalResult.length > 0 ? totalResult[0].total : 0;

    return {
      files: result.map((r) => r.file),
      totalFiles,
      page,
      limit,
    };
  }

  // get totalCompleted files

  // async getAllDownloadedFiles(
  //   userId: string,
  //   folderId?: string,
  // ): Promise<{ files: any[] }> {
  //   let matchStage: any = {
  //     userId: new Types.ObjectId(userId),
  //   };

  //   if (folderId) {
  //     matchStage._id = new Types.ObjectId(folderId);
  //   }
  //   const result = await this.folderModel.aggregate([
  //     {
  //       $match: matchStage,
  //     },
  //     {
  //       $unwind: '$files',
  //     },
  //     {
  //       $match: {
  //         'files.status': 'completed',
  //       },
  //     },
  //     {
  //       $project: {
  //         _id: 0,
  //         file: '$files',
  //       },
  //     },
  //   ]);

  //   return {
  //     files: result.map((r) => r.file),
  //   };
  // }
}
