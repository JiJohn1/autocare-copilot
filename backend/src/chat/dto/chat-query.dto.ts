import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class ChatQueryDto {
  @ApiProperty({ example: '엔진 오일 교체 주기는 얼마나 되나요?' })
  @IsString()
  @IsNotEmpty()
  question!: string;

  @ApiPropertyOptional({ example: 3, default: 3 })
  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  topK?: number;
}
