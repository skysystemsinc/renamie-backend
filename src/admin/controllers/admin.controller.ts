import { Controller, Param, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiResponseDto } from 'src/common/dto/api-response.dto';
import { FolderService } from 'src/folder/services/folder.service';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly folderService: FolderService) {}

  @Get('/user/folders/:id')
  async getAll(@Param('id') id: string) {
    // console.log('id', id);
    const folders = await this.folderService.getALLFolders(id);
    return ApiResponseDto.success('User Folders fetched successfully', folders);
  }
}
