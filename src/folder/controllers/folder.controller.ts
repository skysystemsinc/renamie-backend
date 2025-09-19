import {
  Controller,
  Post,
  UseGuards,
  Body,
  Put,
  Param,
  Delete,
  Get,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateFoldersDto } from '../dto/create-folder.dto';
import { FolderService } from '../services/folder.service';
import { ApiResponseDto } from 'src/common/dto/api-response.dto';

@ApiTags('folder')
@Controller('folder')
export class FolderController {
  constructor(private readonly folderService: FolderService) {}

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

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async get(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const folderDetail = await this.folderService.getFolderDetail(userId, id);
    return ApiResponseDto.success(
      'Folder detail fetched successfully',
      folderDetail,
    );
  }
}
