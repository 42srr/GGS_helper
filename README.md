# 42GGS_helper

# 개요

- 42경산 생활에 도움이 되는 서비스를 제공함
- 42경산의 개발 동아리인 GGS에서 제작, 유지, 보수 중

# 실행방법(개발환경)

## 1. DB 컨테이너 실행

- 도커 엔진 설치 필요(도커 데스크탑도 ㄱㅊ)
- backend/ 경로에 docker-compose.yml 파일이 존재
- .env.example 파일을 참고해서 .env 파일 생성 및 정보 입력
- docker compose up -d 명령어로 DB 컨테이너 실행

## 2. 백엔드 및 프론트엔드 개발 서버 실행

- frontend 경로 및 backend 경로에서 npm install 명령어 실행
- .env 파일 채워넣기
- frontend 경로에서 npm run dev 명령어 실행
- backend 경로에서 npm run start:dev 명령어 실행

# 서비스 소개

## 1. 스터디룸 예약

### 개요

- 42 경산의 스터디룸 예약, 관리를 위한 서비스 일체를 제공

## 2. 카뎃 대시보드

### 개요

- 42 경산 카뎃들의 정보를 확인할 수 있는 대시보드 제공

# 기술 스택

## Frontend

- ReactJS
- ShadcnUI

## Backend

- NestJS

## Database

- PostgreSQL

# 개발자

## Frontend

- yutsong
- kjung

## Backend

- yutsong
