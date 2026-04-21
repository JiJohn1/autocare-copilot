import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Optional,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { LogStoreService } from '../../system/log-store.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
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

    // 실제 에러를 LogStore에 기록
    const level = status >= 500 ? 'CRITICAL' : 'WARNING';
    const now   = new Date();
    const time  = now.toTimeString().slice(0, 8);                 // 'HH:MM:SS'
    const type  = `${status} ${HttpStatus[status] ?? 'Error'}`;   // e.g. '404 NOT_FOUND'
    const detail = (request?.url as string) ?? '—';

    this.logStore?.push({ time, type, detail, level });

    reply.status(status).send({ statusCode: status, message });
  }
}
