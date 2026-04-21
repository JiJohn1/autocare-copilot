import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { ChatQueryDto } from './dto/chat-query.dto';
import { RetrievalService } from '../retrieval/retrieval.service';
import { CacheService } from '../cache/cache.service';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly retrieval: RetrievalService,
    private readonly cache: CacheService,
  ) {}

  @Post('query')
  @ApiOperation({ summary: 'RAG 기반 질문 답변' })
  async query(@Body() dto: ChatQueryDto) {
    return this.chatService.query(dto);
  }

  @Get('health')
  @ApiOperation({ summary: '헬스 체크' })
  async health() {
    const [db, redis] = await Promise.all([
      this.retrieval.isConnected(),
      this.cache.isConnected(),
    ]);
    return {
      status: 'ok',
      db: db ? 'connected' : 'disconnected',
      redis: redis ? 'connected' : 'disconnected',
    };
  }
}
