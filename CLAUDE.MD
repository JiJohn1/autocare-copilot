# Project: AutoCare Copilot

## Purpose
현대오토에버 생성형 AI 백엔드 포지션 지원을 위한 토이프로젝트다.
작지만 완성도 높은 RAG 기반 백엔드 서비스를 목표로 한다.
자동차 고객지원 / 딜러 응대 시나리오를 다룬다.

## Primary Goal
사용자 질문에 대해 문서 기반 검색을 수행하고,
근거가 있는 생성형 AI 답변을 반환하는 REST API를 제공한다.

## Tech Stack
- Node.js LTS
- TypeScript
- NestJS
- Fastify
- PostgreSQL
- pgvector
- Redis
- Docker Compose
- Swagger
- pnpm

## Development Principles
- 프론트엔드는 react를 사용하여 최소화한다.
- 백엔드 구조의 명확성과 실행 가능성을 우선한다.
- 과도한 추상화와 과설계는 피한다.
- 작은 단계로 구현하고 매 단계 실행 검증을 한다.

## Architecture Rules
- NestJS module 기반 구조를 유지한다.
- 기능은 chat, document, retrieval, llm, cache, common 중심으로 나눈다.
- AI provider는 교체 가능성을 고려하되, 처음에는 OpenAI 하나만 구현한다.
- 서비스 경계를 불필요하게 잘게 나누지 않는다.
- MVP에서는 인증을 넣지 않는다.

## Project Structure
- src/app.module.ts
- src/main.ts
- src/common/*
- src/chat/*
- src/document/*
- src/retrieval/*
- src/llm/*
- src/cache/*
- src/config/*
- test/*
- docker-compose.yml
- README.md

## Coding Rules
- TypeScript strict mode 유지
- DTO / Service / Controller 구분
- env 값은 config module로 관리
- 하드코딩 금지
- 에러 응답 형식 일관성 유지
- 응답에는 가능하면 latency, sources를 포함

## API Priorities
1. POST /api/v1/chat/query
2. POST /api/v1/documents
3. GET /health
4. Swagger setup

## Data Rules
- 문서는 chunk 단위로 저장한다.
- chunk에는 source, title, content, embedding, metadata를 저장한다.
- chat 응답에는 answer, sources, score, latency 필드를 포함한다.

## Infra Rules
- 로컬 실행은 docker compose up 기준으로 단순해야 한다.
- postgres, redis는 compose로 띄운다.
- app은 로컬 실행 또는 compose 둘 다 가능하게 한다.
- 개발자가 이해하기 어려운 스크립트는 만들지 않는다.

## Testing Rules
- 최소한의 e2e 또는 integration 테스트를 작성한다.
- 핵심은 chat query flow와 document ingestion flow다.
- 테스트 불안정성보다 단순하고 재현 가능한 테스트를 선호한다.

## Work Style For Claude
- 항상 먼저 변경 계획을 짧게 설명한다.
- 한 번에 너무 많은 파일을 만들지 않는다.
- 작업 후 실행 방법과 검증 방법을 제시한다.
- 불확실하면 가장 단순한 결정을 제안한다.
- README와 명령어 문서화까지 포함해서 작업한다.