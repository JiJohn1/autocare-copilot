import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateDocumentDto {
  @ApiProperty({ example: '현대 아반떼 오너스 매뉴얼' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'avante_manual.pdf' })
  @IsString()
  @IsNotEmpty()
  source!: string;

  @ApiProperty({ example: '엔진 오일은 주행거리 10,000km 또는 6개월마다 교체하세요.' })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({ example: { page: 42, category: 'maintenance' } })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
