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

---

## GCP 배포 가이드

로컬 `docker-compose`와 동일한 구조를 GCP VM에서 실행합니다.  
외부에서는 **포트 80(nginx)만** 열리고, DB/Redis는 내부 네트워크에서만 동작합니다.

### 아키텍처

```
인터넷 → GCP VM:80 (nginx)
              ├── /api/*     → backend:3000 (NestJS, 내부)
              ├── /api-docs  → backend:3000 (Swagger, 내부)
              └── /*         → React 정적 파일 (nginx가 직접 서빙)
```

---

### Step 1. GCP VM 생성

[GCP Console](https://console.cloud.google.com) → Compute Engine → VM 인스턴스 만들기

| 설정 | 값 |
|------|-----|
| 머신 유형 | e2-medium (vCPU 2, RAM 4GB) |
| 리전 | us-central1 (무료 크레딧 효율 최대) |
| OS | Debian 12 |
| 부팅 디스크 | 20GB |
| 방화벽 | HTTP 트래픽 허용 체크 ✓ |

> 무료 크레딧($300)으로 e2-medium을 1개월간 실행하기에 충분합니다.

---

### Step 2. VM에 Docker 설치

```bash
# VM SSH 접속
gcloud compute ssh [VM_이름] --zone=us-central1-a

# Docker 설치
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 재접속 (그룹 적용)
exit
gcloud compute ssh [VM_이름] --zone=us-central1-a

# docker compose plugin 설치 확인
docker compose version
```

---

### Step 3. 코드 받고 환경변수 설정

```bash
git clone https://github.com/[본인 GitHub]/AutoCareCopilot.git
cd AutoCareCopilot

# 환경변수 파일 생성 (실제 값 입력)
cp .env.production.example .env.production
nano .env.production
```

`.env.production`에서 반드시 채워야 할 항목:
- `DB_PASSWORD` — 추측하기 어려운 비밀번호로 변경
- `OPENAI_API_KEY` — 실제 API 키

---

### Step 4. DB 마이그레이션 실행

```bash
# postgres 컨테이너만 먼저 실행
docker compose -f docker-compose.prod.yml up -d postgres

# 마이그레이션 (로컬에서 했다면 DB 볼륨 초기화 후 재실행)
docker compose -f docker-compose.prod.yml run --rm backend \
  node -e "require('./dist/scripts/migrate')" 2>/dev/null || \
  docker run --rm --network autocarecop_default \
    -e DB_HOST=postgres -e DB_PORT=5432 \
    -e DB_NAME=autocare -e DB_USER=postgres \
    -e DB_PASSWORD=$(grep DB_PASSWORD .env.production | cut -d= -f2) \
    --env-file .env.production \
    $(docker compose -f docker-compose.prod.yml images -q backend 2>/dev/null || echo "backend") \
    node dist/scripts/migrate.js 2>/dev/null || true
```

> 더 간단한 방법: Step 5에서 전체 실행 후 아래 마이그레이션 명령 사용

---

### Step 5. 전체 서비스 실행

```bash
docker compose -f docker-compose.prod.yml up -d --build
#env파일 명명 다른경우
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

빌드 시간 약 3~5분 소요 (첫 실행 시).

```bash
# 마이그레이션 (서비스 실행 후)
docker compose -f docker-compose.prod.yml exec backend node dist/scripts/migrate.js
#docker compose --env-file .env.production -f docker-compose.prod.yml exec backend node dist/scripts/migrate.js

# 상태 확인
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs backend --tail=30
docker compose --env-file .env.production -f docker-compose.prod.yml logs backend --tail=50
docker compose --env-file .env.production -f docker-compose.prod.yml logs frontend --tail=50
```

---

### Step 6. 방화벽 포트 열기 (gcloud CLI)

```bash
gcloud compute firewall-rules create allow-http-prod \
  --allow tcp:80 \
  --target-tags=http-server \
  --description="AutoCare Copilot HTTP"
```

> GCP Console에서 "HTTP 트래픽 허용"을 체크했다면 이미 열려 있습니다.

---

### Step 7. 접속 확인

VM 외부 IP 확인:
```bash
gcloud compute instances describe [VM_이름] \
  --zone=us-central1-a \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
```

브라우저에서:
- `http://[외부IP]` — 프론트엔드 대시보드
- `http://[외부IP]/api-docs` — Swagger UI

---

### (선택) 무료 도메인 연결 - DuckDNS

1. [duckdns.org](https://www.duckdns.org) 접속 → GitHub 로그인
2. 원하는 서브도메인 등록 (예: `autocare-copilot.duckdns.org`)
3. VM 외부 IP 입력 후 저장
4. VM에서 IP 자동 갱신 설정 (cron):
```bash
# DuckDNS 갱신 스크립트 (토큰은 duckdns.org에서 확인)
DUCK_TOKEN=[본인_토큰]
DUCK_DOMAIN=[서브도메인]

echo "*/5 * * * * curl -s 'https://www.duckdns.org/update?domains=${DUCK_DOMAIN}&token=${DUCK_TOKEN}&ip=' > /dev/null" | crontab -
```

---

### 유지보수 명령어

```bash
# 상태 확인
docker compose --env-file .env.production -f docker-compose.prod.yml ps

# 로그 확인
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f

# 코드 업데이트 후 재배포
git pull
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build

# 서비스 중지
docker compose --env-file .env.production -f docker-compose.prod.yml down

# DB 데이터 유지하며 중지
docker compose -f docker-compose.prod.yml stop
```
