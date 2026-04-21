import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class LlmService {
  private readonly client: OpenAI;
  private readonly embeddingModel: string;
  private readonly chatModel: string;

  constructor(private readonly config: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.config.getOrThrow<string>('OPENAI_API_KEY'),
    });
    this.embeddingModel = this.config.get<string>(
      'OPENAI_EMBEDDING_MODEL',
      'text-embedding-3-small',
    );
    this.chatModel = this.config.get<string>(
      'OPENAI_CHAT_MODEL',
      'gpt-4o-mini',
    );
  }

  async embedText(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: this.embeddingModel,
      input: text,
    });
    return response.data[0].embedding;
  }

  async chunkDocument(
    fullText: string,
    fileName: string,
    options?: { maxChunks?: number; windowIndex?: number; totalWindows?: number },
  ): Promise<Array<{ title: string; content: string; metadata: Record<string, unknown> }>> {
    const maxChunks = options?.maxChunks ?? 20;
    // GPT 컨텍스트 안전 범위: 10,000자 (≈ 7,500 토큰)
    const truncated = fullText.slice(0, 10_000);
    const windowLabel =
      options?.totalWindows && options.totalWindows > 1
        ? ` (섹션 ${(options.windowIndex ?? 0) + 1}/${options.totalWindows})`
        : '';

    try {
      const response = await this.client.chat.completions.create({
        model: this.chatModel,
        messages: [
          {
            role: 'system',
            content:
              '당신은 자동차 기술 문서를 분석하는 전문가입니다. 주어진 문서를 의미 단위로 청크 분할하세요.',
          },
          {
            role: 'user',
            content:
              `다음 문서${windowLabel}를 의미적으로 완결된 청크 단위로 분할하세요. ` +
              `각 청크는 독립적으로 이해 가능해야 합니다. 최대 ${maxChunks}개 청크로 분할하세요.\n\n` +
              `파일명: ${fileName}\n\n문서 내용:\n${truncated}\n\n` +
              `반드시 다음 JSON 배열 형식으로만 응답하세요 (마크다운 없이 순수 JSON):\n` +
              `[{"title": "청크 제목", "content": "청크 내용", "pageHint": 1}]`,
          },
        ],
        temperature: 0,
        max_tokens: 4096,
      });

      const raw = (response.choices[0].message.content ?? '').trim();
      // 마크다운 코드펜스 제거 (```json ... ```)
      const jsonStr = raw.startsWith('```')
        ? raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
        : raw;

      const parsed = JSON.parse(jsonStr) as Array<{
        title: string;
        content: string;
        pageHint?: number;
      }>;

      return parsed
        .filter((item) => item.title && item.content)
        .map((item) => ({
          title: item.title,
          content: item.content,
          metadata: {
            fileName,
            pageHint: item.pageHint ?? null,
            windowIndex: options?.windowIndex ?? 0,
          },
        }));
    } catch {
      // 폴백: 텍스트를 3,000자 단위로 자동 분할 (임베딩 토큰 한도 안전)
      const FALLBACK_SIZE = 3_000;
      const fallbackChunks: Array<{ title: string; content: string; metadata: Record<string, unknown> }> = [];
      let idx = 0;
      let part = 0;
      while (idx < fullText.length) {
        const slice = fullText.slice(idx, idx + FALLBACK_SIZE);
        fallbackChunks.push({
          title: `${fileName} — 파트 ${part + 1}`,
          content: slice,
          metadata: { fileName, fallback: true, part },
        });
        idx += FALLBACK_SIZE;
        part++;
      }
      return fallbackChunks;
    }
  }

  async generateAnswer(question: string, contexts: string[]): Promise<string> {
    const contextText = contexts
      .map((c, i) => `[문서 ${i + 1}]\n${c}`)
      .join('\n\n');

    const response = await this.client.chat.completions.create({
      model: this.chatModel,
      messages: [
        {
          role: 'system',
          content:
            '당신은 자동차 고객지원 전문가입니다. 주어진 문서 내용을 바탕으로 정확하고 간결하게 답변하세요. 문서에 근거가 없으면 모른다고 말하세요.',
        },
        {
          role: 'user',
          content: `다음 문서들을 참고하여 질문에 답해주세요.\n\n${contextText}\n\n질문: ${question}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 1024,
    });

    return response.choices[0].message.content ?? '';
  }
}
