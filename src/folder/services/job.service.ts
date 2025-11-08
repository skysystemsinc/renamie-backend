// job.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FolderRepository } from '../repositories/folder.repository';

@Injectable()
export class JobService {
  private readonly logger = new Logger(JobService.name);

  constructor(private readonly folderRepository: FolderRepository) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async softDeleteOldFiles() {
    await this.folderRepository.markOldFilesAsDeleted();
  }
}
