import { ApiProperty } from '@nestjs/swagger';
import { DocumentChunk } from '../document.service';

export class IngestResultDto {
  @ApiProperty({ description: '저장된 문서 청크 목록' })
  chunks!: DocumentChunk[];

  @ApiProperty({ description: '저장된 청크 수' })
  total!: number;

  @ApiProperty({ description: '저장 실패(스킵)된 청크 수' })
  skipped!: number;
}
