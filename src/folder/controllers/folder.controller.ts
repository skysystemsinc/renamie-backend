import {
  Controller,
  Post,
  UseGuards,
  Body,
  Put,
  Param,
  Delete,
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
    const folderUpdatet = await this.folderService.updateFolder(
      createFoldersDto,
      userId,
      id,
    );
    // console.log('folder update',folderUpdatet)
    return ApiResponseDto.success('Folder updated successfully', folderUpdatet);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: CreateFoldersDto })
  @ApiBearerAuth('JWT-auth')
  async delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const folderUpdatet = await this.folderService.deleteFolder(userId, id);
    return ApiResponseDto.success('Folder deleted successfully', folderUpdatet);
  }
}
