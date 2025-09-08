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
  Req,
  Headers,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { PaymentService } from '../services/payment.service';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { UpdatePaymentDto } from '../dto/update-payment.dto';
import { ProcessPaymentDto } from '../dto/process-payment.dto';
import { RefundPaymentDto } from '../dto/refund-payment.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { User, UserDocument, UserRole } from '../../users/schemas/user.schema';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import Stripe from 'stripe';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }

  @ApiOperation({ summary: 'Process a payment' })
  @Post('process')
  @UseGuards(JwtAuthGuard)
  async processPayment(
    @Body() processPaymentDto: ProcessPaymentDto,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.paymentService.processPayment(processPaymentDto, userId);
    return ApiResponseDto.success('Payment processed successfully', result);
  }

  @Post('confirm/:paymentIntentId')
  @UseGuards(JwtAuthGuard)
  async confirmPayment(@Param('paymentIntentId') paymentIntentId: string) {
    const payment = await this.paymentService.confirmPayment(paymentIntentId);
    return ApiResponseDto.success('Payment confirmed successfully', payment);
  }

  @Post('refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ADMIN)
  async refundPayment(@Body() refundPaymentDto: RefundPaymentDto) {
    const payment = await this.paymentService.refundPayment(refundPaymentDto);
    return ApiResponseDto.success('Refund processed successfully', payment);
  }

  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    try {
      const event = JSON.parse(req.rawBody?.toString() || '{}');
      await this.paymentService.handleStripeWebhook(event);
      return { received: true };
    } catch (error) {
      console.error('Webhook error:', error);
      return { received: false, error: error.message };
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ADMIN)
  async findAll(@Query() paginationDto: PaginationDto) {
    const payments = await this.paymentService.findAll();
    return ApiResponseDto.success('Payments retrieved successfully', payments);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  async findByUserId(
    @Param('userId') userId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    const payments = await this.paymentService.findByUserId(userId);
    return ApiResponseDto.success('User payments retrieved successfully', payments);
  }

  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  async findByOrderId(@Param('orderId') orderId: string) {
    const payments = await this.paymentService.findByOrderId(orderId);
    return ApiResponseDto.success('Order payments retrieved successfully', payments);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getPaymentStats(@Query('userId') userId?: string) {
    const stats = await this.paymentService.getPaymentStats(userId);
    return ApiResponseDto.success('Payment stats retrieved successfully', stats);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    const payment = await this.paymentService.findById(id);
    return ApiResponseDto.success('Payment retrieved successfully', payment);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    const payment = await this.paymentService.updatePayment(id, updatePaymentDto);
    return ApiResponseDto.success('Payment updated successfully', payment);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    await this.paymentService.deletePayment(id);
    return ApiResponseDto.success('Payment deleted successfully');
  }
}
