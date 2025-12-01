import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Plan, PlanSchema } from '../payments/schemas/plan.schema';
import { PlanSeeder } from './plan.seeder';
import { SeederService } from './seeder.service';
import { UserSeeder } from './user.seeder';
import { User, UserSchema } from 'src/users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Plan.name, schema: PlanSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [PlanSeeder, SeederService, UserSeeder],
  exports: [PlanSeeder, SeederService, UserSeeder],
})
export class SeedersModule {}
