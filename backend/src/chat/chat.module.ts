import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { LlmModule } from '../llm/llm.module';
import { RetrievalModule } from '../retrieval/retrieval.module';
import { CacheModule } from '../cache/cache.module';
import { SystemModule } from '../system/system.module';

@Module({
  imports: [LlmModule, RetrievalModule, CacheModule, SystemModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
