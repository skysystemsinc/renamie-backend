// job.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FolderRepository } from '../repositories/folder.repository';
import { FolderService } from './folder.service';

@Injectable()
export class JobService {
  private readonly logger = new Logger(JobService.name);

  constructor(
    private readonly folderService: FolderService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async softDeleteOldFiles() {
    await this.folderService.markOldFilesAsDeleted();
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async permanentlyDeleteOldFiles() {
    await this.folderService.permanentlyDeleteOldFiles();
  }
}
