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
import { SubscriptionService } from 'src/subscriptions/services/subscription.service';

@Injectable()
export class FolderService {
  constructor(
    @Inject(forwardRef(() => S3Service))
    private readonly s3Service: S3Service,
    private readonly userService: UserService,
    private readonly folderRepository: FolderRepository,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async createFolder(createFoldersDto: CreateFoldersDto, userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    let parentId = userId;
    if (user?.isCollaborator && user?.inviteAccepted) {
      parentId = user?.userId.toString();
    }

    const parent = await this.userService.findById(parentId);
    if (!parent) {
      throw new NotFoundException('user not found');
    }

    const subs = await this.subscriptionService.findSubsByUserId(parentId);
    if (!subs) {
      throw new NotFoundException('Subscription not found');
    }

    if (parent.folderCount >= subs.features.folders) {
      throw new NotFoundException(`You have reached your folder limit.`);
    }

    const existing = await this.folderRepository.findByNameAndUserId(
      createFoldersDto.name,
      userId,
    );

    if (existing) {
      throw new ConflictException('Folder with this name already exists');
    }

    const createdFolder = this.folderRepository.create({
      userId: new Types.ObjectId(userId),
      name: createFoldersDto.name,
      parentUser: new Types.ObjectId(parentId),
    });

    await this.userService.updateUser(parentId, {
      folderCount: parent.folderCount + 1,
    });

    return createdFolder;
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
    let parentId = userId;
    if (user.isCollaborator && user.inviteAccepted) {
      parentId = user.userId.toString();
    }
    const parentUser = await this.userService.findById(parentId);
    if (!parentUser) {
      throw new NotFoundException('User not found');
    }
    return await this.folderRepository.findAllByParentId(parentId);
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
    console.log('user', user);

     const folder = await this.folderRepository.findAllByParentId(
      (user as any)?._id.toString(),
    );
    console.log('folders',folder);
    if(folder?.length === 0){
      throw new NotFoundException('You do not have collaboration with this user to access this folder');
    }
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

  private reverseFileName(
    invoiceId: string,
    invoiceDate: string,
    format: string | undefined,
  ): string {
    if (format?.toLowerCase() === 'date-invoice') {
      return `${invoiceDate}-${invoiceId}`;
    }

    if (format?.toLowerCase() === 'invoice-date') {
      return `${invoiceId}-${invoiceDate}`;
    }
    if (format?.toLowerCase() === 'invoice') {
      return `${invoiceId}`;
    }
    if (format?.toLowerCase() === 'date') {
      return `${invoiceDate}`;
    }

    return `${invoiceId}-${invoiceDate}`;
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
          file?.invoiceId,
          file?.invoiceDate,
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
  async getALLFiles(userId: string, page = 1, limit = 10) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const allFiles = await this.folderRepository.getAllCompletedFiles(
      userId,
      page,
      limit,
    );
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
