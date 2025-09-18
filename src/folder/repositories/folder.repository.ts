import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Folder, FolderDocument } from 'src/payments/schemas/folder.schema';

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
}
