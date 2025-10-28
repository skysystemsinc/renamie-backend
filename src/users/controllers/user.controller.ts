import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../schemas/user.schema';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
// @UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @ApiBody({ type: CreateUserDto })
  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.create(createUserDto);
    return ApiResponseDto.success('User created successfully', user);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll() {
    const users = await this.userService.findAll();
    return ApiResponseDto.success('Users retrieved successfully', users);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    return ApiResponseDto.success('User retrieved successfully', user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.userService.update(id, updateUserDto);
    return ApiResponseDto.success('User updated successfully', user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    await this.userService.delete(id);
    return ApiResponseDto.success('User deleted successfully');
  }

  //
  @Post('invite-user')
  @Roles(UserRole.ADMIN)
  async createInviteUser(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.createInvitedUser(createUserDto);
    return ApiResponseDto.success('Collaborator created successfully', user);
  }
}
