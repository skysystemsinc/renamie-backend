import { Controller, Get, Post, UseGuards, Body } from '@nestjs/common';
import { SubscriptionService } from '../services/subscription.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateSubscriptionDto } from '../dto/create-subscription.dto';
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
        @CurrentUser('id') userId: string
    ) {
        return this.subscriptionService.createSubscription(createSubscriptionDto, userId);
    }
}
