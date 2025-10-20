import {
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateFoldersDto } from '../dto/create-folder.dto';
import { UserService } from 'src/users/services/user.service';
import { FolderRepository } from '../repositories/folder.repository';
import { Types } from 'mongoose';
import { S3Service } from 'src/common/services/s3.service';

@Injectable()
export class FolderService {
  constructor(
    @Inject(forwardRef(() => S3Service))
    private readonly s3Service: S3Service,
    private readonly userService: UserService,
    private readonly folderRepository: FolderRepository,
  ) {}

  async createFolder(createFoldersDto: CreateFoldersDto, userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.folderRepository.findByNameAndUserId(
      createFoldersDto.name,
      userId,
    );

    if (existing) {
      throw new ConflictException('Folder with this name already exists');
    }

    return this.folderRepository.create({
      userId: new Types.ObjectId(userId),
      name: createFoldersDto.name,
    });
  }

  async updateFolder(
    createFoldersDto: CreateFoldersDto,
    userId: string,
    id: string,
  ) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const folder = await this.folderRepository.findById(id);
    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    if (folder.userId.toString() !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this folder',
      );
    }

    const existing = await this.folderRepository.findByNameAndUserId(
      createFoldersDto.name,
      userId,
    );

    if (existing) {
      throw new ConflictException('Folder with this name already exists');
    }

    return this.folderRepository.update(id, createFoldersDto.name);
  }

  async deleteFolder(userId: string, id: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const folder = await this.folderRepository.findById(id);
    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    if (folder.userId.toString() !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this folder',
      );
    }

    return this.folderRepository.delete(id);
  }

  async getALLFolders(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return await this.folderRepository.findAllByUserId(userId);
  }

  // folder Detail
  async getFolderDetail(
    userId: string,
    folderId: string,
    page = 1,
    limit = 10,
  ) {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    return await this.folderRepository.getPaginatedFiles(folderId, page, limit);
  }

  async saveFilestoFolder(folderId: string, files: any[]) {
    try {
      const folder = await this.folderRepository.findById(folderId);
      if (!folder) {
        throw new NotFoundException('Folder not found');
      }
      const newFiles = files.map((file) => ({
        ...file,
        _id: new Types.ObjectId(),
      }));
      folder.files.push(...newFiles);
      await folder.save();
      return newFiles;
    } catch (error) {
      throw new Error(`Failed to save files: ${error.message}`);
    }
  }

  async getFiles(userId: string, id: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return await this.folderRepository.findById(id);
  }

  // // rename file
  // async renameFileInFolder(fileId: string, newName: string) {
  //   const fileRecord = await this.folderRepository.findFileById(fileId);
  //   if (!fileRecord) throw new NotFoundException('File not found');
  //   const oldKey = fileRecord.url;
  //   const fileExtension = oldKey.substring(oldKey.lastIndexOf('.'));
  //   const newKey = this.s3Service.generatekey(
  //     `${newName}${fileExtension.toLowerCase()}`,
  //   );
  //   await this.s3Service.copyFile(oldKey, newKey);
  //   await this.s3Service.deleteFile(oldKey);
  //   await this.folderRepository.updateFileData(fileId, {
  //     newName: `${newName}${fileExtension}`,
  //     url: newKey,
  //     rename_at: new Date(),
  //   });

  //   const updatedFile = await this.folderRepository.findFileById(fileId);
  //   return updatedFile;
  // }

  // create format
  async createFormat(userId: string, folderId: string, format: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const folder = await this.folderRepository.findById(folderId);
    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    const updatedFolder = await this.folderRepository.updateFormat(
      folderId,
      format,
    );
    return updatedFolder;
  }

  private reverseFileName(oldName: string, format: string | undefined): string {
    const nameWithoutExt = oldName.replace(/\.[^/.]+$/, '');
    const parts = nameWithoutExt.split('-');
    if (parts.length < 2) return nameWithoutExt;
    const [first, second] = parts;

    const firstIsInvoice = /^\d+$/.test(first);
    const secondIsInvoice = /^\d+$/.test(second);

    if (format?.toLowerCase() === 'date-invoice') {
      if (!firstIsInvoice && secondIsInvoice) return nameWithoutExt;
      if (firstIsInvoice && !secondIsInvoice) return `${second}-${first}`;
    }

    if (format?.toLowerCase() === 'invoice-date') {
      if (firstIsInvoice && !secondIsInvoice) return nameWithoutExt;
      if (!firstIsInvoice && secondIsInvoice) return `${second}-${first}`;
    }

    return nameWithoutExt;
  }

  //  update format
  async updateFormat(userId: string, folderId: string, format: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const folder = await this.folderRepository.findById(folderId);
    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    const updatedFolder = await this.folderRepository.updateFormat(
      folderId,
      format,
    );

    if (updatedFolder?._id) {
      const completedFiles = await this.folderRepository.getCompletedFiles(
        updatedFolder._id.toString(),
      );

      for (const file of completedFiles) {
        const newFormattedName = this.reverseFileName(
          file.newName,
          updatedFolder?.format,
        );
        await this.s3Service.renameFileInFolder(
          file._id.toString(),
          newFormattedName,
        );
      }
    }
    return updatedFolder;
  }

  // get All files that has completed status
  async getALLFiles(userId: string, page = 1,
    limit = 10,) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const allFiles = await this.folderRepository.getAllCompletedFiles(userId, page, limit);
    return allFiles;
  }

  async getFilesByFolder(
  userId: string,
  folderId: string,
  page = 1,
  limit = 10,
) {
  const user = await this.userService.findById(userId);
  if (!user) throw new NotFoundException('User not found');

   const folder = await this.folderRepository.findById(folderId);
    if (!folder) {
      throw new NotFoundException('Folder not found');
    }
  const folderFiles = await this.folderRepository.getFilesByFolder(
    userId,
    folderId,
    page,
    limit,
  );

  return folderFiles;
}

}
