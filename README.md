# GGS Helper (룸잇)

> 회의실 및 스터디룸 예약 관리 시스템

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

## 📋 목차

- [개요](#개요)
- [주요 기능](#주요-기능)
- [빠른 시작](#빠른-시작)
- [기술 스택](#기술-스택)
- [문서](#문서)
- [개발자](#개발자)

## 🎯 개요

GGS Helper는 회의실 및 스터디룸을 효율적으로 관리하기 위한 웹 기반 예약 시스템입니다.

**핵심 가치:**

- 📅 실시간 예약 현황 확인
- 🔒 안전한 인증 및 권한 관리
- 📊 통계 및 분석 기능
- 📱 모바일 반응형 지원

## ✨ 주요 기능

### 사용자 기능

- **실시간 예약 현황**: 달력 형식으로 예약 현황 확인
- **회의실 예약**: 시간대별 예약 생성 및 충돌 자동 검증
- **체크아웃 인증**: 사진 업로드를 통한 퇴실 인증
- **예약 관리**: 내 예약 목록 조회 및 취소

### 관리자 기능

- **예약 관리**: 전체 예약 조회, 승인, 취소
- **회의실 관리**: 회의실 정보 수정, Excel 일괄 업로드
- **사용자 관리**: 회원 정보 조회, 권한 관리
- **통계 및 리포트**: 예약 통계 및 사용 현황 분석
- **백업/복원**: 데이터베이스 백업 및 복원 기능

## 🚀 빠른 시작

### 필수 요구사항

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 16 (Docker 사용 시 불필요)

## 🛠 기술 스택

### Frontend

- React 19 + TypeScript
- Vite (빌드 도구)
- React Router (라우팅)
- Shadcn/ui (UI 컴포넌트)
- Tailwind CSS (스타일링)
- Sonner (Toast 알림)

### Backend

- NestJS (Node.js 프레임워크)
- TypeORM (ORM)
- JWT (인증/인가)
- class-validator (DTO 검증)
- Throttler (Rate Limiting)

### Database

- PostgreSQL 16

### DevOps

- Docker Compose
- Git

### 보안 기능

- JWT 기반 인증 및 토큰 블랙리스트
- Rate Limiting (IP 기반)
- SQL Injection 방지 (TypeORM)
- XSS 방지
- 비밀번호 암호화 (bcrypt)

## 📚 문서

모든 프로젝트 문서는 [docs/](./docs) 폴더에 있습니다.

- **[API.md](./docs/API.md)** - API 명세 및 엔드포인트 문서
- **[TABLES.md](./docs/TABLES.md)** - 데이터베이스 스키마 정의
- **[START_DEV.md](./docs/START_DEV.md)** - 개발 환경 셋팅 가이드
- **[FEAT.md](./docs/FEAT.md)** - 구현된 기능 목록
- **[AS.md](./docs/AS.md)** - 유지보수 계획서

## 👥 개발자

### Frontend

- yutsong
- kjung

### Backend

- yutsong
- mujang

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 🤝 기여

버그 리포트 및 기능 제안은 Issues를 통해 제출해주세요.
