import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SystemService } from './system.service';
import { ActivityLogService } from './activity-log.service';
import { ServiceLogService } from './service-log.service';

@ApiTags('system')
@Controller('system')
export class SystemController {
  constructor(
    private readonly systemService: SystemService,
    private readonly activityLog: ActivityLogService,
    private readonly serviceLog: ServiceLogService,
  ) {}

  @Get('logs')
  @ApiOperation({ summary: '최근 오류 로그 조회' })
  getLogs() {
    return this.systemService.getLogs();
  }

  @Get('weekly')
  @ApiOperation({ summary: '최근 7일 문서 등록 현황' })
  getWeekly() {
    return this.systemService.getWeeklyStats();
  }

  @Get('activity')
  @ApiOperation({ summary: 'RAG 파이프라인 활동 로그 조회' })
  getActivity() {
    return this.activityLog.getAll();
  }

  @Get('service-logs')
  @ApiOperation({ summary: '서비스 동작 로그 조회 (RAG 파이프라인, LLM, 캐시 등)' })
  async getServiceLogs() {
    const logs = await this.serviceLog.getLogs();
    return { logs, count: logs.length };
  }
}
