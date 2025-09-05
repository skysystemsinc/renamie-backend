import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Plan, PlanSchema } from '../payments/schemas/plan.schema';
import { PlanSeeder } from './plan.seeder';
import { SeederService } from './seeder.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Plan.name, schema: PlanSchema },
    ]),
  ],
  providers: [
    PlanSeeder,
    SeederService,
  ],
  exports: [
    PlanSeeder,
    SeederService,
  ],
})
export class SeedersModule {}
