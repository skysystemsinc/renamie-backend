import { Controller, Get, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { PlanService } from '../../services/plan/plan.service';
import { PlanResponseDto, PlansListResponseDto } from '../../dto/plan-response.dto';
import { PlanInterval } from '../../../payments/schemas/plan.schema';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Plans')
@Controller('plans')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @ApiOperation({ summary: 'Get all plans' })
  @Get()
  async findAll(@Query() query: {active: boolean}): Promise<PlansListResponseDto> {
    return this.planService.findAll();
  }

  @Get('active')
  async findActivePlans(): Promise<PlansListResponseDto> {
    return this.planService.findActivePlans();
  }

  @Get('interval/:interval')
  async findByInterval(@Param('interval') interval: PlanInterval): Promise<PlansListResponseDto> {
    if (!Object.values(PlanInterval).includes(interval)) {
      throw new HttpException('Invalid interval', HttpStatus.BAD_REQUEST);
    }
    return this.planService.findByInterval(interval);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<PlanResponseDto> {
    const plan = await this.planService.findById(id);
    if (!plan) {
      throw new HttpException('Plan not found', HttpStatus.NOT_FOUND);
    }
    return plan;
  }

  @Get('stripe/:stripePriceId')
  async findByStripePriceId(@Param('stripePriceId') stripePriceId: string): Promise<PlanResponseDto> {
    const plan = await this.planService.findByStripePriceId(stripePriceId);
    if (!plan) {
      throw new HttpException('Plan not found', HttpStatus.NOT_FOUND);
    }
    return plan;
  }
}
