import { Controller, Post, Req, Headers } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { StripeService } from '../stripe.service';

@ApiTags('Stripe')
@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Stripe webhook' })
  async handleWebhook(@Req() req: RawBodyRequest<Request>) {
    // ✅ Temporary debug logging - remove after verification
    console.log('================ WEBHOOK RECEIVED ================');
    console.log('Raw Body Type:', typeof req.rawBody);
    console.log('Raw Body is Buffer:', Buffer.isBuffer(req.rawBody));
    console.log('Raw Body Length:', req.rawBody?.length);
    console.log('Has Stripe Signature:', !!req.headers['stripe-signature']);
    console.log('===================================================');

    try {
      await this.stripeService.handleStripeWebhook(req);
      return { received: true };
    } catch (error) {
      console.error('Webhook error:', error);
      return { received: false, error: error.message };
    }
  }

}
