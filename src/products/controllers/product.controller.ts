import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ProductService } from '../services/product.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/schemas/user.schema';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() createProductDto: CreateProductDto) {
    const product = await this.productService.create(createProductDto);
    return ApiResponseDto.success('Product created successfully', product);
  }

  @Get()
  async findAll() {
    const products = await this.productService.findAll();
    return ApiResponseDto.success('Products retrieved successfully', products);
  }

  @Get('category/:category')
  async findByCategory(@Param('category') category: string) {
    const products = await this.productService.findByCategory(category);
    return ApiResponseDto.success('Products retrieved successfully', products);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const product = await this.productService.findById(id);
    return ApiResponseDto.success('Product retrieved successfully', product);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    const product = await this.productService.update(id, updateProductDto);
    return ApiResponseDto.success('Product updated successfully', product);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    await this.productService.delete(id);
    return ApiResponseDto.success('Product deleted successfully');
  }
}
