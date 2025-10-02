import {
  Controller,
  Get,
  Post,
  UseGuards,
  Body,
  Param,
  Delete,
} from '@nestjs/common';
import { SubscriptionService } from '../services/subscription.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  CancelSubscriptionDto,
  CreateSubscriptionDto,
} from '../dto/create-subscription.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@ApiTags('Subscriptions')
@Controller('subscription')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: CreateSubscriptionDto })
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiBearerAuth('JWT-auth')
  async create(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.subscriptionService.createSubscription(
      createSubscriptionDto,
      userId,
    );
  }

  // // cencel susbcription
  @Delete('cancel/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cancel a subscription' })
  @ApiBearerAuth('JWT-auth')
  async cancel(@Param('id') id: string) {
    console.log('subscriptionId', id);
    const updatedSubs = await this.subscriptionService.cancelSubscription(id);
    return {
      success: true,
      message: 'Subscription cancel_at_period_end updated successfully',
      data: updatedSubs,
    };
  }
}
