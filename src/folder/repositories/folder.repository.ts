import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Folder, FolderDocument } from '../schema/folder.schema';
import { format } from 'path';
import { QuickBookFormatDto } from '../dto/create-folder.dto';

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

  // find folder by folder id and  parent id
  async findByFolderIdAndParentId(
    folderId: string,
    parentId: string,
  ): Promise<FolderDocument[]> {
    return this.folderModel
      .find({
        _id: new Types.ObjectId(folderId),
        parentUser: new Types.ObjectId(parentId),
      })
      .exec();
  }

  // find folders by parent id
  async findAllByParentId(parentId: string): Promise<FolderDocument[]> {
    return this.folderModel
      .find({
        parentUser: new Types.ObjectId(parentId),
      })
      .sort({ createdAt: -1 })
      .exec();
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
    userId: string,
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
        {
          $match: {
            _id: new Types.ObjectId(folderId),
            parentUser: new Types.ObjectId(userId),
          },
        },

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

  // get completed files  (with pagination)
  async getAllCompletedFilesWithPagination(
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
          parentUser: new Types.ObjectId(userId),
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
      { $match: { parentUser: new Types.ObjectId(userId) } },
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

  // get file by folder   (with pagination)
  async getPaginatedFilesByFolder(
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
          parentUser: new Types.ObjectId(userId),
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
          parentUser: new Types.ObjectId(userId),
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

  // get files by date  (with pagination)
  async getPaginatedFilesByDate(
    userId: string,
    page = 1,
    limit = 10,
    date: string,
  ): Promise<{
    files: any[];
    totalFiles: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const startDate = new Date(date);
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setUTCHours(23, 59, 59, 999);
    const result = await this.folderModel.aggregate([
      {
        $match: {
          parentUser: new Types.ObjectId(userId),
        },
      },
      { $unwind: '$files' },
      {
        $match: {
          'files.status': 'completed',
          'files.createdAt': {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      { $sort: { 'files.createdAt': -1 } },
      { $skip: skip },
      { $limit: limit },
      { $project: { _id: 0, file: '$files' } },
    ]);
    const totalResult = await this.folderModel.aggregate([
      {
        $match: {
          parentUser: new Types.ObjectId(userId),
        },
      },
      { $unwind: '$files' },
      {
        $match: {
          'files.status': 'completed',
          'files.createdAt': {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
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

  // get by both folder and date
  async getPaginatedFilesByFolderAndDate(
    userId: string,
    folderId: string,
    page = 1,
    limit = 10,
    date: string,
  ) {
    const skip = (page - 1) * limit;

    const startDate = new Date(date);
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setUTCHours(23, 59, 59, 999);

    const files = await this.folderModel.aggregate([
      {
        $match: {
          parentUser: new Types.ObjectId(userId),
          _id: new Types.ObjectId(folderId),
        },
      },
      { $unwind: '$files' },
      {
        $match: {
          'files.status': 'completed',
          'files.createdAt': { $gte: startDate, $lte: endDate },
        },
      },
      { $sort: { 'files.createdAt': -1 } },
      { $skip: skip },
      { $limit: limit },
      { $project: { _id: 0, file: '$files' } },
    ]);

    const total = await this.folderModel.aggregate([
      {
        $match: {
          parentUser: new Types.ObjectId(userId),
          _id: new Types.ObjectId(folderId),
        },
      },
      { $unwind: '$files' },
      {
        $match: {
          'files.status': 'completed',
          'files.createdAt': { $gte: startDate, $lte: endDate },
        },
      },
      { $count: 'total' },
    ]);

    return {
      files: files.map((f) => f.file),
      totalFiles: total.length ? total[0].total : 0,
      page,
      limit,
    };
  }

  // get file by folder
  async getFilesByFolder(
    userId: string,
    folderId: string,
  ): Promise<{
    files: any[];
    totalFiles: number;
  }> {
    const result = await this.folderModel.aggregate([
      {
        $match: {
          parentUser: new Types.ObjectId(userId),
          _id: new Types.ObjectId(folderId),
        },
      },
      { $unwind: '$files' },
      { $match: { 'files.status': 'completed' } },
      { $project: { _id: 0, file: '$files' } },
    ]);
    const totalFiles = result.length;
    return {
      files: result.map((r) => r.file),
      totalFiles,
    };
  }

  // get all completed files
  async getAllCompletedFiles(userId: string): Promise<{
    files: any[];
    totalFiles: number;
  }> {
    const result = await this.folderModel.aggregate([
      {
        $match: {
          parentUser: new Types.ObjectId(userId),
        },
      },
      { $unwind: '$files' },
      { $match: { 'files.status': 'completed' } },
      { $project: { _id: 0, file: '$files' } },
    ]);

    const totalFiles = result.length;
    return {
      files: result.map((r) => r.file),
      totalFiles,
    };
  }

  //  get all by date
  async getFilesByDate(
    userId: string,
    date: string,
  ): Promise<{
    files: any[];
    totalFiles: number;
  }> {
    const startDate = new Date(date);
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setUTCHours(23, 59, 59, 999);
    const result = await this.folderModel.aggregate([
      {
        $match: {
          parentUser: new Types.ObjectId(userId),
        },
      },
      { $unwind: '$files' },
      {
        $match: {
          'files.status': 'completed',
          'files.createdAt': {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      { $project: { _id: 0, file: '$files' } },
    ]);
    const totalResult = await this.folderModel.aggregate([
      {
        $match: {
          parentUser: new Types.ObjectId(userId),
        },
      },
      { $unwind: '$files' },
      {
        $match: {
          'files.status': 'completed',
          'files.createdAt': {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      { $count: 'total' },
    ]);
    const totalFiles = totalResult.length > 0 ? totalResult[0].total : 0;
    return {
      files: result.map((r) => r.file),
      totalFiles,
    };
  }

  // get by folder id and date both

  async getFilesByFolderAndDate(
    userId: string,
    folderId: string,
    date: string,
  ) {
    const startDate = new Date(date);
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setUTCHours(23, 59, 59, 999);

    const files = await this.folderModel.aggregate([
      {
        $match: {
          parentUser: new Types.ObjectId(userId),
          _id: new Types.ObjectId(folderId),
        },
      },
      { $unwind: '$files' },
      {
        $match: {
          'files.status': 'completed',
          'files.createdAt': { $gte: startDate, $lte: endDate },
        },
      },
      { $project: { _id: 0, file: '$files' } },
    ]);

    const total = files.length;
    return {
      files: files.map((f) => f.file),
      totalFiles: total,
    };
  }

  async updateFolder(id: string, data: any) {
    const updatedFolder = await this.folderModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true },
    );
    return updatedFolder;
  }

  // get all uploaded files of the folder
  async getAllUploadedFiles(
    parentId: string,
    folderId: string,
  ): Promise<{
    files: any[];
    totalFiles: number;
  }> {
    const result = await this.folderModel.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(folderId),
          parentUser: new Types.ObjectId(parentId),
        },
      },
      { $unwind: '$files' },
      { $project: { _id: 0, file: '$files' } },
    ]);
    const totalFiles = result.length;
    return {
      files: result.map((r) => r.file),
      totalFiles,
    };
  }
}
