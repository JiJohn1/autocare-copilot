import { Module } from '@nestjs/common';
import { CacheModule } from '../cache/cache.module';
import { ServiceLogService } from '../system/service-log.service';
import { RetrievalService } from './retrieval.service';

@Module({
  imports: [CacheModule],
  providers: [RetrievalService, ServiceLogService],
  exports: [RetrievalService],
})
export class RetrievalModule {}
