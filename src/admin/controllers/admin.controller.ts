import {
  Controller,
  Param,
  Get,
  Post,
  UseGuards,
  Body,
  Put,
  Delete,
  Req,
  Query,
  UseInterceptors,
  UploadedFiles,
  HttpException,
  HttpStatus,
  Res,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ApiResponseDto } from 'src/common/dto/api-response.dto';
import { FolderService } from 'src/folder/services/folder.service';
import {
  adminRenameFileDto,
  CreateFoldersDto,
  FormatDto,
} from '../dto/create.admin.dto';
import {
  QuickBookFormatDto,
  RenameFileDto,
} from 'src/folder/dto/create-folder.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { S3Service } from 'src/common/services/s3.service';
import { PresignedUrlDto } from 'src/s3/dto/upload.dto';
import type { Response } from 'express';
import {
  CollaboratorResponseDto,
  CreateInvitedUserDto,
} from 'src/users/dto/create-user.dto';
import { AuthService } from 'src/auth/services/auth.service';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly folderService: FolderService,
    private readonly s3Service: S3Service,
    private readonly authService: AuthService,
  ) {}

  @Get('/user/folders/:id')
  async getAll(@Param('id') id: string) {
    const folders = await this.folderService.getALLFolders(id);
    return ApiResponseDto.success('User Folders fetched successfully', folders);
  }

  @Post('/user/folder/create')
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: CreateFoldersDto })
  @ApiOperation({ summary: 'Create a new folder' })
  @ApiBearerAuth('JWT-auth')
  async create(
    @Body() createFoldersDto: CreateFoldersDto,
    // @CurrentUser('id') userId: string,
  ) {
    console.log('create', createFoldersDto);
    const folder = await this.folderService.createFolder(
      createFoldersDto,
      createFoldersDto.userId,
    );

    return ApiResponseDto.success('Admin created folder successfully', folder);
  }

  //
  @Put('/user/folder/update/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: CreateFoldersDto })
  @ApiBearerAuth('JWT-auth')
  async update(
    @Param('id') id: string,
    @Body() createFoldersDto: CreateFoldersDto,
    // @CurrentUser('id') userId: string,
  ) {
    const folderUpdated = await this.folderService.updateFolder(
      createFoldersDto,
      createFoldersDto.userId,
      id,
    );
    return ApiResponseDto.success(
      'Admin updated folder successfully',
      folderUpdated,
    );
  }

  @Delete('/user/folder/delete/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ type: CollaboratorResponseDto })
  async deleteFolder(@Param('id') id: string, @Query('userId') userId: string) {
    const folderDeleted = await this.folderService.deleteFolder(userId, id);
    return ApiResponseDto.success(
      'Admin deleted user folder successfully',
      folderDeleted,
    );
  }

  // fetch folder details
  @Get('/user/folder/detail/:folderId/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async get(
    @Param('userId') userId: string,
    @Param('folderId') folderId: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    
    const folderDetail = await this.folderService.getFolderDetail(
      userId,
      folderId,
      page,
      limit,
    );
    return ApiResponseDto.success(
      'Folder detail fetched successfully',
      folderDetail,
    );
  }

  // create
  @Post('/user/file/format/:folderId')
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: RenameFileDto })
  @ApiOperation({ summary: 'Save file format to folder' })
  @ApiBearerAuth('JWT-auth')
  async createFormate(
    @Param('folderId') folderId: string,
    @Body() formatDto: FormatDto,
  ) {
    const result = await this.folderService.createFormat(
      formatDto.userId,
      folderId,
      formatDto.format,
    );
    return ApiResponseDto.success(
      'Admin Saved Folder Formate Successfully',
      result,
    );
  }

  // update
  @Put('/user/file/format/:folderId')
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: RenameFileDto })
  @ApiOperation({ summary: 'Save file format to folder' })
  @ApiBearerAuth('JWT-auth')
  async updateFormat(
    @Param('folderId') folderId: string,
    @Body() formatDto: FormatDto,
  ) {
    const result = await this.folderService.updateFormat(
      formatDto?.userId,
      folderId,
      formatDto.format,
    );
    return ApiResponseDto.success(
      ' Admin Updated Folder Formate Successfully',
      result,
    );
  }

  @Post('upload-files/:folderId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files'))
  @ApiOperation({ summary: 'Upload multiple files to S3' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Files uploaded successfully' })
  async uploadFiles(
    // @CurrentUser('id') userId: string,
    @Param('folderId') folderId: string,
    @Query('userId') userId: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const result = await this.s3Service.uploadFiles(userId, folderId, files);
    return ApiResponseDto.success('Files uploaded successfully', result);
  }

  // download url
  @Get('presigned-download-url/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Generate pre-signed URL for file download' })
  @ApiResponse({
    status: 200,
    description: 'Pre-signed URL generated successfully',
  })
  async getPresignedDownloadUrl(
    @Param('userId') userId: string,
    @Query() query: PresignedUrlDto,
    // @CurrentUser('id') userId: string,
  ) {
    try {
      console.log('user id', userId);
      await this.s3Service.downloadUrl(userId, query.key);
      const url = await this.s3Service.getPresignedDownloadUrl(query.key, {
        expiresIn: query.expiresIn,
        mode: query.mode,
      });

      return {
        message: 'Pre-signed download URL generated successfully',
        data: {
          url,
          key: query.key,
          expiresIn: query.expiresIn || 3600,
        },
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // rename file API
  @Post('file-rename/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: adminRenameFileDto })
  @ApiOperation({ summary: 'Rename a file in S3 and DB' })
  @ApiBearerAuth('JWT-auth')
  async renameFile(
    @Param('id') fileId: string,
    @Body() renameFileDto: adminRenameFileDto,
    // @CurrentUser('id') userId: string,
  ) {
    const result = await this.s3Service.fileRename(
      renameFileDto.userId,
      fileId,
      renameFileDto.newName,
    );
    return ApiResponseDto.success('File renamed successfully', result);
  }

  // Quickbook
  @Post('book/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: RenameFileDto })
  @ApiOperation({ summary: 'Save file format to folder' })
  @ApiBearerAuth('JWT-auth')
  async createQuickBook(
    @Param('id') folderId: string,
    @Query('userId') userId: string,
    @Body() quickBookFormatDto: QuickBookFormatDto,
    // @CurrentUser('id') userId: string,
  ) {
    console.log('quickBookFormatDto', quickBookFormatDto);
    const result = await this.folderService.createQuickBook(
      userId,
      folderId,
      quickBookFormatDto,
    );
    return ApiResponseDto.success('Quick book saved successfully', result);
  }

  // export Files
  @Get('export/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async exportFiles(
    // @CurrentUser('id') userId: string,
    @Param('id') folderId: string,
    @Query('userId') userId: string,
    @Res() res: Response,
  ) {
    const streamFile = await this.folderService.getExportFiles(
      userId,
      folderId,
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="export.csv"`);
    streamFile.getStream().pipe(res);
  }

  // get all files from folder module
  @Get('user/files/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async getAllFiles(
    @Param('userId') userId: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('folderId') folderId?: string,
    @Query('date') date?: string,
    @Query('timezoneOffset') timezoneOffset?: string,
  ) {
    console.log('user id get all', userId);
    const userFiles =
      folderId && !date
        ? await this.folderService.getFilesByFolder(
            userId,
            folderId,
            page,
            limit,
          )
        : date && !folderId
          ? await this.folderService.getFilesByDate({
              userId,
              date,
              page,
              limit,
              timezoneOffset,
            })
          : folderId && date
            ? await this.folderService.getFilesByDateAndFolder({
                userId,
                folderId,
                date,
                page,
                limit,
                timezoneOffset,
              })
            : await this.folderService.getALLFiles(userId, page, limit);
    return ApiResponseDto.success('Files fetched successfully', userFiles);
  }

  //  zip files
  @Get('/user/zip-download/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async getZipDownload(
    @Param('userId') userId: string,
    @Res() res: Response,
    @Query('folderId') folderId?: string,
    @Query('date') date?: string,
    @Query('timezoneOffset') timezoneOffset?: string,
  ) {
    const userFiles =
      folderId && !date
        ? await this.folderService.getFilesByFolder(userId, folderId)
        : date && !folderId
          ? await this.folderService.getFilesByDate({
              userId,
              date,
              timezoneOffset,
            })
          : folderId && date
            ? await this.folderService.getFilesByDateAndFolder({
                userId,
                folderId,
                date,
                timezoneOffset,
              })
            : await this.folderService.getALLFiles(userId);
    const files = userFiles.files;
    if (!files?.length) {
      throw new NotFoundException('No files found');
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=download.zip');

    // console.log('user files',userFiles);
    return this.folderService.streamZipFromS3(files, res);
  }

  // create invite user
  @Post('/invite-user/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ type: CollaboratorResponseDto })
  async createInviteUser(
    @Param('userId') userId: string,
    @Body() createInvitedUserDto: CreateInvitedUserDto,
  ) {
    const user = await this.authService.createInvitedUser(
      userId,
      createInvitedUserDto,
    );
    return ApiResponseDto.success('Collaborator registered successfully', user);
  }

  @Get('/user/collaborators/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async getCollaborators(
    @Param('userId') userId: string,
    // @CurrentUser('id') userId: string,
  ) {
    const user = await this.authService.getCollaborators(userId);
    return ApiResponseDto.success('Collaborator Fetched successfully', user);
  }

  @Delete('/user/remove-collaborator/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ type: CollaboratorResponseDto })
  async removeCollaborator(
    @Param('id') id: string,
    @Query('userId') userId: string,
  ) {
    const collaboartor = await this.authService.removeCollaborator(userId, id);
    return ApiResponseDto.success(
      'Collaborator deleted successfully!',
      collaboartor,
    );
  }
}
