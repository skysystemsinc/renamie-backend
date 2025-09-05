import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlanController } from './controllers/plan/plan.controller';
import { PlanService } from './services/plan/plan.service';
import { PlanRepository } from './repositories/plan.repository';
import { Plan, PlanSchema } from '../payments/schemas/plan.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Plan.name, schema: PlanSchema }]),
  ],
  controllers: [PlanController],
  providers: [PlanService, PlanRepository],
  exports: [PlanService, PlanRepository],
})
export class PlansModule {}
