import { Controller, Post, Req, Headers } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { StripeService } from '../stripe.service';

@ApiTags('Stripe')
@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) { }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Stripe webhook' })
  async handleWebhook(@Req() req: RawBodyRequest<Request>) {
    try {
      console.log('================ WEBHOOK RECEIVED ================');
      console.log('Headers:', req.headers);
      console.log('Stripe Signature Header:', req.headers['stripe-signature']);
      console.log('Raw Body Type:', typeof req.rawBody);
      console.log('Raw Body Buffer Length:', req.rawBody?.length);
      console.log('Raw Body Preview:', req.rawBody?.toString('utf8').slice(0, 300)); // First 300 chars
      console.log('===================================================');

      return { received: true, message: 'Logging webhook data only for debugging.' };
    } catch (error) {
      console.error('Webhook error:', error);
      return { received: false, error: error.message };
    }
  }

}
