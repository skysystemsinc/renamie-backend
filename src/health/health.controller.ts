import { Controller, Get } from '@nestjs/common';
import { ApiResponseDto } from '../common/dto/api-response.dto';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return ApiResponseDto.success('Service is healthy', {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }
}
