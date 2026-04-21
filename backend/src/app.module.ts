import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ChatModule } from './chat/chat.module';
import { DocumentModule } from './document/document.module';
import { LlmModule } from './llm/llm.module';
import { RetrievalModule } from './retrieval/retrieval.module';
import { CacheModule } from './cache/cache.module';
import { SystemModule } from './system/system.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LlmModule,
    CacheModule,
    RetrievalModule,
    DocumentModule,
    ChatModule,
    SystemModule,
  ],
  providers: [
    // APP_FILTER로 등록하면 DI 컨테이너가 의존성 주입 후 전역 필터로 사용
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
