import { Controller, Post, UseGuards, Body } from '@nestjs/common';
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
}
