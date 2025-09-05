import { Injectable } from '@nestjs/common';
import { PlanRepository } from '../../repositories/plan.repository';
import { PlanResponseDto, PlansListResponseDto } from '../../dto/plan-response.dto';
import { PlanInterval } from '../../../payments/schemas/plan.schema';

@Injectable()
export class PlanService {
  constructor(private readonly planRepository: PlanRepository) {}

  async findAll(): Promise<PlansListResponseDto> {
    const plans = await this.planRepository.findAll();
    return {
      plans: plans.map(plan => this.mapToResponseDto(plan)),
      total: plans.length,
    };
  }

  async findById(id: string): Promise<PlanResponseDto | null> {
    const plan = await this.planRepository.findById(id);
    return plan ? this.mapToResponseDto(plan) : null;
  }

  async findByStripePriceId(stripePriceId: string): Promise<PlanResponseDto | null> {
    const plan = await this.planRepository.findByStripePriceId(stripePriceId);
    return plan ? this.mapToResponseDto(plan) : null;
  }

  async findByInterval(interval: PlanInterval): Promise<PlansListResponseDto> {
    const plans = await this.planRepository.findByInterval(interval);
    return {
      plans: plans.map(plan => this.mapToResponseDto(plan)),
      total: plans.length,
    };
  }

  async findActivePlans(): Promise<PlansListResponseDto> {
    const plans = await this.planRepository.findActivePlans();
    return {
      plans: plans.map(plan => this.mapToResponseDto(plan)),
      total: plans.length,
    };
  }

  private mapToResponseDto(plan: any): PlanResponseDto {
    return {
      id: plan._id.toString(),
      stripePriceId: plan.stripePriceId,
      name: plan.name,
      description: plan.description,
      amount: plan.amount,
      currency: plan.currency,
      interval: plan.interval,
      trialPeriodDays: plan.trialPeriodDays,
      metadata: plan.metadata,
      features: plan.features,
      isActive: plan.isActive,
      stripeProductId: plan.stripeProductId,
      order: plan.order,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }
}
