import { Module } from '@nestjs/common';
import { RetrievalModule } from '../retrieval/retrieval.module';
import { CacheModule } from '../cache/cache.module';
import { LogStoreService } from './log-store.service';
import { ActivityLogService } from './activity-log.service';
import { ServiceLogService } from './service-log.service';
import { SystemService } from './system.service';
import { SystemController } from './system.controller';

@Module({
  imports: [RetrievalModule, CacheModule],
  providers: [LogStoreService, ActivityLogService, ServiceLogService, SystemService],
  controllers: [SystemController],
  exports: [LogStoreService, ActivityLogService, ServiceLogService],
})
export class SystemModule {}
