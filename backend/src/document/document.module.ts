import { Module } from '@nestjs/common';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { IngestJobStore } from './ingest-job.store';
import { LlmModule } from '../llm/llm.module';
import { RetrievalModule } from '../retrieval/retrieval.module';
import { SystemModule } from '../system/system.module';

@Module({
  imports: [LlmModule, RetrievalModule, SystemModule],
  providers: [DocumentService, IngestJobStore],
  controllers: [DocumentController],
})
export class DocumentModule {}
