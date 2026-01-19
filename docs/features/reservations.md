# 예약 시스템

GGS Helper의 회의실 예약 관리 시스템을 설명합니다.

## 주요 기능

- 실시간 예약 현황 확인
- 예약 충돌 자동 검증
- 체크인/체크아웃 관리
- 사진 업로드 기반 퇴실 인증
- 노쇼 관리 및 패널티

## 예약 생명주기

```
[생성] → [확정] → [진행중] → [체크아웃 대기] → [완료]
   │        │
   └────────┴──────────────→ [취소]
```

### 예약 상태

| 상태 | 설명 | 다음 상태 |
|-----|------|----------|
| `pending` | 승인 대기 | confirmed, cancelled |
| `confirmed` | 확정됨 | in_progress, cancelled |
| `in_progress` | 진행 중 (체크인 완료) | awaiting_checkout |
| `awaiting_checkout` | 체크아웃 대기 (사진 업로드 완료) | finished |
| `finished` | 완료 (관리자 승인) | - |
| `cancelled` | 취소됨 | - |

## 예약 충돌 체크

```typescript
// 충돌 조건: 새 예약의 시간 범위가 기존 예약과 겹침
const hasConflict = existing.startTime < new.endTime
                 && existing.endTime > new.startTime;
```

**API 엔드포인트:**

```bash
POST /reservations/check-conflict
{
  "roomId": 1,
  "startDatetime": "2024-01-20T14:00:00Z",
  "endDatetime": "2024-01-20T16:00:00Z"
}
```

## 체크인 프로세스

1. 예약 시작 시간 도래
2. 사용자가 체크인 버튼 클릭
3. 상태: `confirmed` → `in_progress`
4. 시작 시간 +15분 후 체크인 시 `isLate = true`

## 체크아웃 프로세스

1. 사용자가 정리 사진 업로드
2. 상태: `in_progress` → `awaiting_checkout`
3. 관리자가 사진 확인 및 승인
4. 상태: `awaiting_checkout` → `finished`

**사진 업로드 API:**

```bash
POST /reservations/:id/checkout
Content-Type: multipart/form-data

photo: <File>
notes: "정리 완료"
```

## 노쇼 관리

### 노쇼 신고

- 예약 시작 시간 +15분 후에도 체크인하지 않은 경우
- 누구나 신고 가능 (Public API)
- 신고 3회 이상 시 자동 노쇼 처리

### 패널티

- 노쇼 횟수가 사용자 레코드에 누적
- 노쇼 3회 이상 시 예약 금지 가능 (관리자 설정)

## 주요 API 엔드포인트

| 메서드 | 경로 | 설명 |
|-------|------|------|
| POST | `/reservations` | 예약 생성 |
| POST | `/reservations/check-conflict` | 충돌 체크 |
| GET | `/reservations` | 전체 예약 조회 |
| GET | `/reservations/my` | 내 예약 조회 |
| PATCH | `/reservations/:id/cancel` | 예약 취소 |
| POST | `/reservations/:id/check-in` | 체크인 |
| POST | `/reservations/:id/checkout` | 체크아웃 |
| POST | `/reservations/:id/no-show` | 노쇼 신고 |

## 다음 단계

- [관리자 기능](./admin.md)
- [API 가이드](../development/api-guide.md)
