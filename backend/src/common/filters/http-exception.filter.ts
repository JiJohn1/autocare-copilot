import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Optional,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { LogStoreService } from '../../system/log-store.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(
    @Optional() private readonly logStore?: LogStoreService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx     = host.switchToHttp();
    const reply   = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? ((exception.getResponse() as { message?: string | string[] }).message ??
           exception.message)
        : 'Internal server error';

    // 500 에러는 반드시 스택 포함해서 로그 출력
    if (status >= 500) {
      this.logger.error(
        `[${request?.method ?? '?'}] ${request?.url ?? '?'} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    // 실제 에러를 LogStore에 기록
    const level = status >= 500 ? 'CRITICAL' : 'WARNING';
    const now   = new Date();
    const time  = now.toTimeString().slice(0, 8);
    const type  = `${status} ${HttpStatus[status] ?? 'Error'}`;
    const detail = (request?.url as string) ?? '—';

    this.logStore?.push({ time, type, detail, level });

    reply.status(status).send({ statusCode: status, message });
  }
}
