# deploy documents
배포 방법 안내를 위한 문서
## 개요
프론트엔드, 백엔드, DB를 각각의 컨테이너로 배포하는 것이 목적
## 순서
1. 환경변수 값을 채워넣는다
2. 커맨드를 입력해서 배포한다.
## 커맨드
docker compose up --build -d    // 빌드 & 배포
docker compose down             // 중단
docker compose down -v          // 도커 볼륨 제거(사용에 주의)

