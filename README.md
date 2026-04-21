# AutoCare Copilot

RAG(검색 증강 생성) 기반 자동차 고객지원 백엔드 서비스 + 관리 대시보드 UI.

## 구조

```
AutoCareCopilot/
├── backend/           # NestJS + Fastify (REST API)
├── frontend/          # React + Vite + Tailwind (Stitch 2.0)
├── docker-compose.yml # PostgreSQL + pgvector, Redis
└── .env.example
```

## 빠른 시작

### 1. 환경변수 설정

```bash
cp .env.example .env
# .env에서 OPENAI_API_KEY 입력
```

### 2. 인프라 실행 (Docker)

```bash
docker compose up -d
```

PostgreSQL(5432), Redis(6379) 컨테이너가 시작됩니다.

### 3. DB 마이그레이션

```bash
cd backend
pnpm install
pnpm migrate
```

`document_chunks` 테이블과 ivfflat 인덱스가 생성됩니다.

### 4. 백엔드 실행

```bash
cd backend
pnpm start:dev
# http://localhost:3000
```

### 5. 프론트엔드 실행

```bash
cd frontend
pnpm install
pnpm dev
# http://localhost:5173
```

---

## API 명세

### POST /api/v1/chat/query

질문에 대해 문서 벡터 검색 후 LLM 답변 반환.

**Request**
```json
{ "question": "엔진 오일 교체 주기는?", "topK": 3 }
```

**Response**
```json
{
  "answer": "일반적으로 10,000km 또는 6개월마다 교체를 권장합니다.",
  "sources": [
    { "title": "아반떼 매뉴얼", "source": "avante.pdf", "content": "...", "score": 0.891 }
  ],
  "latency": 1243
}
```

### POST /api/v1/documents

문서 chunk 등록 (임베딩 생성 후 pgvector 저장).

**Request**
```json
{
  "title": "현대 아반떼 오너스 매뉴얼",
  "source": "avante_manual.pdf",
  "content": "엔진 오일은 10,000km마다 교체하세요.",
  "metadata": { "page": 42 }
}
```

**Response** `201`
```json
{ "id": "uuid", "title": "...", "source": "...", "createdAt": "..." }
```

### GET /api/v1/documents

등록된 chunk 목록 조회.

### GET /api/v1/chat/health

```json
{ "status": "ok", "db": "connected", "redis": "connected" }
```

---

## 프론트엔드 페이지

| 경로 | 설명 |
|---|---|
| `/system` | 시스템 모니터링 대시보드 (Health 연동) |
| `/chat` | RAG 채팅 인터페이스 |
| `/docs` | 문서 chunk 등록 및 목록 |
| `/retrieval` | 벡터 검색 결과 디버그 |

---

## 기술 스택

| 영역 | 기술 |
|---|---|
| Backend | NestJS, Fastify, TypeScript |
| Database | PostgreSQL 16 + pgvector |
| Cache | Redis 7 |
| AI | OpenAI (text-embedding-3-small, gpt-4o-mini) |
| Frontend | React 19, Vite, Tailwind CSS v4 |
| 인프라 | Docker Compose |
| 패키지 | pnpm |

---

## Swagger UI

백엔드 실행 후 `http://localhost:3000/api-docs` 에서 확인 가능합니다.
