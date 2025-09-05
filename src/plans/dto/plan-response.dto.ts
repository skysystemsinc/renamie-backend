import { PlanInterval, PlanFeatures } from '../../payments/schemas/plan.schema';

export class PlanResponseDto {
  id: string;
  stripePriceId: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  interval: PlanInterval;
  trialPeriodDays?: number;
  metadata?: Record<string, any>;
  features: PlanFeatures;
  isActive: boolean;
  stripeProductId?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export class PlansListResponseDto {
  plans: PlanResponseDto[];
  total: number;
}
