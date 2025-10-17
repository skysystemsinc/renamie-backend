import {
  Controller,
  Post,
  UseGuards,
  Body,
  Put,
  Param,
  Delete,
  Get,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateFoldersDto, RenameFileDto } from '../dto/create-folder.dto';
import { FolderService } from '../services/folder.service';
import { ApiResponseDto } from 'src/common/dto/api-response.dto';
import { FileQueueService } from 'src/queue/services/file.queue.service';
import { S3Service } from 'src/common/services/s3.service';

@ApiTags('folder')
@Controller('folder')
export class FolderController {
  constructor(
    private readonly folderService: FolderService,
    private readonly fileQueueService: FileQueueService,
    private readonly S3Service: S3Service,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: CreateFoldersDto })
  @ApiOperation({ summary: 'Create a new folder' })
  @ApiBearerAuth('JWT-auth')
  async create(
    @Body() createFoldersDto: CreateFoldersDto,
    @CurrentUser('id') userId: string,
  ) {
    const folder = await this.folderService.createFolder(
      createFoldersDto,
      userId,
    );
    return ApiResponseDto.success('Folder created successfully', folder);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: CreateFoldersDto })
  @ApiBearerAuth('JWT-auth')
  async update(
    @Param('id') id: string,
    @Body() createFoldersDto: CreateFoldersDto,
    @CurrentUser('id') userId: string,
  ) {
    const folderUpdated = await this.folderService.updateFolder(
      createFoldersDto,
      userId,
      id,
    );
    // console.log('folder update',folderUpdatet)
    return ApiResponseDto.success('Folder updated successfully', folderUpdated);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const folderDeleted = await this.folderService.deleteFolder(userId, id);
    return ApiResponseDto.success('Folder deleted successfully', folderDeleted);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async getAll(@CurrentUser('id') userId: string) {
    const folders = await this.folderService.getALLFolders(userId);
    return ApiResponseDto.success('Folders fetched successfully', folders);
  }

  // fetch folder
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async get(
    @Param('id') folderId: string,
    @CurrentUser('id') userId: string,
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

  // rename file API
  @Post('file-rename/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: RenameFileDto })
  @ApiOperation({ summary: 'Rename a file in S3 and DB' })
  @ApiBearerAuth('JWT-auth')
  async renameFile(
    @Param('id') fileId: string,
    @Body() renameFileDto: RenameFileDto,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.S3Service.renameFileInFolder(
      fileId,
      renameFileDto.newName,
    );
    return ApiResponseDto.success('File renamed successfully', result);
  }
}
