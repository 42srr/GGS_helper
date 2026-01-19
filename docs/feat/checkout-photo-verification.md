# 예약 체크아웃 인증 사진 업로드 기능 구현 계획서

## 1. 개요

### 목적
- 회의실 사용 후 체크아웃 시 인증 사진을 업로드하도록 하여 회의실 정리 상태 확인
- 회의실 관리 책임성 강화 및 다음 사용자를 위한 정리 상태 검증
- 관리자가 회의실 사용 이력 및 정리 상태를 모니터링할 수 있도록 지원

### 주요 기능
1. 예약 체크아웃 시 인증 사진 업로드 (필수)
2. 업로드된 사진 저장 및 관리
3. 예약 상세 정보에서 체크아웃 사진 조회
4. 관리자 대시보드에서 체크아웃 사진 모니터링

---

## 2. 기술 스택

### Backend
- **파일 업로드**: Multer (NestJS에서 사용)
- **이미지 처리**: Sharp (리사이징, 최적화)
- **파일 저장소**: 로컬 파일 시스템 (추후 AWS S3/클라우드 스토리지 확장 가능)
- **파일 형식**: JPEG, PNG, WebP
- **최대 파일 크기**: 5MB

### Frontend
- **이미지 캡처**: HTML5 Camera API 또는 파일 업로드
- **이미지 프리뷰**: React 컴포넌트
- **업로드 UI**: 드래그 앤 드롭 또는 카메라 촬영

### Database
- **테이블**: Reservation 엔티티에 필드 추가
- **필드**:
  - `checkoutPhotoPath`: string (사진 파일 경로)
  - `checkoutPhotoUrl`: string (접근 가능한 URL)
  - `checkoutVerifiedAt`: timestamp (체크아웃 인증 완료 시간)

---

## 3. 데이터베이스 스키마

### Reservation 엔티티 수정

```typescript
@Entity('reservations')
export class Reservation {
  // 기존 필드...

  @Column({ type: 'varchar', length: 500, nullable: true })
  checkoutPhotoPath: string; // 서버 파일 시스템 경로

  @Column({ type: 'varchar', length: 500, nullable: true })
  checkoutPhotoUrl: string; // 클라이언트 접근 URL

  @Column({ type: 'timestamp', nullable: true })
  checkoutVerifiedAt: Date; // 체크아웃 인증 완료 시간

  @Column({ type: 'text', nullable: true })
  checkoutNotes: string; // 체크아웃 시 메모 (선택)
}
```

---

## 4. Backend 구현

### 4.1 파일 업로드 설정

#### `src/common/multer.config.ts` (새로 생성)

```typescript
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

export const multerConfig = {
  storage: diskStorage({
    destination: './uploads/checkout-photos',
    filename: (req, file, callback) => {
      const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
      callback(null, uniqueName);
    },
  }),
  fileFilter: (req, file, callback) => {
    // 이미지 파일만 허용
    if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
      return callback(new Error('Only image files are allowed!'), false);
    }
    callback(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
};
```

### 4.2 이미지 처리 서비스

#### `src/common/services/image.service.ts` (새로 생성)

```typescript
import { Injectable } from '@nestjs/common';
import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ImageService {
  /**
   * 이미지 리사이징 및 최적화
   */
  async optimizeImage(
    filePath: string,
    maxWidth: number = 1200,
    quality: number = 80,
  ): Promise<string> {
    const outputPath = filePath.replace(
      path.extname(filePath),
      '_optimized' + path.extname(filePath),
    );

    await sharp(filePath)
      .resize(maxWidth, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality })
      .toFile(outputPath);

    // 원본 파일 삭제
    fs.unlinkSync(filePath);

    return outputPath;
  }

  /**
   * 썸네일 생성
   */
  async createThumbnail(
    filePath: string,
    size: number = 300,
  ): Promise<string> {
    const thumbnailPath = filePath.replace(
      path.extname(filePath),
      '_thumb' + path.extname(filePath),
    );

    await sharp(filePath)
      .resize(size, size, {
        fit: 'cover',
      })
      .jpeg({ quality: 70 })
      .toFile(thumbnailPath);

    return thumbnailPath;
  }

  /**
   * 파일 삭제
   */
  deleteFile(filePath: string): void {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
```

### 4.3 Reservation Controller 수정

#### `src/reservation/reservation.controller.ts`

```typescript
import {
  Controller,
  Post,
  Param,
  UploadedFile,
  UseInterceptors,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReservationService } from './reservation.service';
import { multerConfig } from '../common/multer.config';

@Controller('reservations')
@UseGuards(JwtAuthGuard)
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  // 기존 엔드포인트...

  /**
   * 체크아웃 인증 사진 업로드
   */
  @Post(':id/checkout-photo')
  @UseInterceptors(FileInterceptor('photo', multerConfig))
  async uploadCheckoutPhoto(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body('notes') notes?: string,
  ) {
    return await this.reservationService.uploadCheckoutPhoto(
      id,
      file,
      notes,
    );
  }

  /**
   * 체크아웃 사진 조회
   */
  @Get(':id/checkout-photo')
  async getCheckoutPhoto(@Param('id', ParseIntPipe) id: number) {
    return await this.reservationService.getCheckoutPhoto(id);
  }
}
```

### 4.4 Reservation Service 수정

#### `src/reservation/reservation.service.ts`

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from './entities/reservation.entity';
import { ImageService } from '../common/services/image.service';
import * as path from 'path';

@Injectable()
export class ReservationService {
  constructor(
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    private imageService: ImageService,
  ) {}

  /**
   * 체크아웃 인증 사진 업로드
   */
  async uploadCheckoutPhoto(
    reservationId: number,
    file: Express.Multer.File,
    notes?: string,
  ): Promise<any> {
    if (!file) {
      throw new BadRequestException('Photo file is required');
    }

    const reservation = await this.reservationRepository.findOne({
      where: { id: reservationId },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    // 이미 체크아웃 완료된 경우 기존 사진 삭제
    if (reservation.checkoutPhotoPath) {
      this.imageService.deleteFile(reservation.checkoutPhotoPath);
    }

    // 이미지 최적화
    const optimizedPath = await this.imageService.optimizeImage(file.path);

    // 썸네일 생성
    const thumbnailPath = await this.imageService.createThumbnail(optimizedPath);

    // URL 생성 (정적 파일 서빙 경로)
    const photoUrl = `/uploads/checkout-photos/${path.basename(optimizedPath)}`;
    const thumbnailUrl = `/uploads/checkout-photos/${path.basename(thumbnailPath)}`;

    // DB 업데이트
    reservation.checkoutPhotoPath = optimizedPath;
    reservation.checkoutPhotoUrl = photoUrl;
    reservation.checkoutVerifiedAt = new Date();
    reservation.checkoutNotes = notes || null;

    await this.reservationRepository.save(reservation);

    return {
      message: 'Checkout photo uploaded successfully',
      photoUrl,
      thumbnailUrl,
      verifiedAt: reservation.checkoutVerifiedAt,
    };
  }

  /**
   * 체크아웃 사진 조회
   */
  async getCheckoutPhoto(reservationId: number): Promise<any> {
    const reservation = await this.reservationRepository.findOne({
      where: { id: reservationId },
      select: ['id', 'checkoutPhotoUrl', 'checkoutVerifiedAt', 'checkoutNotes'],
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (!reservation.checkoutPhotoUrl) {
      return {
        hasPhoto: false,
        message: 'No checkout photo available',
      };
    }

    return {
      hasPhoto: true,
      photoUrl: reservation.checkoutPhotoUrl,
      verifiedAt: reservation.checkoutVerifiedAt,
      notes: reservation.checkoutNotes,
    };
  }
}
```

### 4.5 정적 파일 서빙 설정

#### `src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 정적 파일 서빙 설정
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(3001);
}
bootstrap();
```

---

## 5. Frontend 구현

### 5.1 체크아웃 사진 업로드 컴포넌트

#### `frontend/src/components/checkout/CheckoutPhotoUpload.tsx` (새로 생성)

```typescript
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Upload, X, CheckCircle } from 'lucide-react';

interface CheckoutPhotoUploadProps {
  reservationId: number;
  onUploadSuccess: () => void;
}

export function CheckoutPhotoUpload({
  reservationId,
  onUploadSuccess,
}: CheckoutPhotoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);

      // 미리보기 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('사진을 선택해주세요.');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);
      if (notes) {
        formData.append('notes', notes);
      }

      const response = await fetch(
        `http://localhost:3001/reservations/${reservationId}/checkout-photo`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        alert('✅ 체크아웃 인증이 완료되었습니다.');
        onUploadSuccess();
      } else {
        const error = await response.json();
        alert(`❌ 업로드 실패: ${error.message}`);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Camera className="w-5 h-5 mr-2" />
          체크아웃 인증 사진
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 파일 선택 영역 */}
          {!preview ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">
                회의실 정리 상태를 촬영해주세요
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                사진 선택/촬영
              </Button>
            </div>
          ) : (
            // 미리보기 영역
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-64 object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={clearSelection}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* 메모 입력 */}
          {preview && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                메모 (선택사항)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="특이사항이나 메모를 입력하세요..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
              />
            </div>
          )}

          {/* 업로드 버튼 */}
          {preview && (
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full"
            >
              {uploading ? (
                '업로드 중...'
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  체크아웃 완료
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### 5.2 체크아웃 사진 조회 컴포넌트

#### `frontend/src/components/checkout/CheckoutPhotoView.tsx` (새로 생성)

```typescript
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Calendar } from 'lucide-react';

interface CheckoutPhotoViewProps {
  reservationId: number;
}

export function CheckoutPhotoView({ reservationId }: CheckoutPhotoViewProps) {
  const [photoData, setPhotoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCheckoutPhoto();
  }, [reservationId]);

  const fetchCheckoutPhoto = async () => {
    try {
      const response = await fetch(
        `http://localhost:3001/reservations/${reservationId}/checkout-photo`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPhotoData(data);
      }
    } catch (error) {
      console.error('Failed to fetch checkout photo:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>로딩 중...</div>;
  }

  if (!photoData?.hasPhoto) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">체크아웃 인증 사진이 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Camera className="w-5 h-5 mr-2" />
          체크아웃 인증 사진
        </CardTitle>
      </CardHeader>
      <CardContent>
        <img
          src={`http://localhost:3001${photoData.photoUrl}`}
          alt="Checkout verification"
          className="w-full rounded-lg mb-4"
        />
        {photoData.verifiedAt && (
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            {new Date(photoData.verifiedAt).toLocaleString('ko-KR')}
          </div>
        )}
        {photoData.notes && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700">{photoData.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### 5.3 예약 상세 모달에 통합

#### `frontend/src/components/reservations/ReservationDetailModal.tsx` 수정

```typescript
// 기존 코드에 추가
import { CheckoutPhotoView } from '../checkout/CheckoutPhotoView';

// 모달 내부에 추가
{reservation.status === 'completed' && (
  <CheckoutPhotoView reservationId={reservation.id} />
)}
```

---

## 6. 추가 기능

### 6.1 관리자 모니터링

- 관리자 대시보드에서 모든 체크아웃 사진 조회
- 정리 상태 불량 시 알림 발송
- 통계: 체크아웃 인증률, 평균 체크아웃 시간 등

### 6.2 체크아웃 필수 정책

```typescript
// ReservationService에 추가
async completeReservation(reservationId: number): Promise<void> {
  const reservation = await this.reservationRepository.findOne({
    where: { id: reservationId },
  });

  // 체크아웃 사진이 없으면 완료 불가
  if (!reservation.checkoutPhotoPath) {
    throw new BadRequestException(
      'Checkout photo is required to complete the reservation'
    );
  }

  reservation.status = 'completed';
  await this.reservationRepository.save(reservation);
}
```

---

## 7. 보안 고려사항

1. **파일 검증**
   - MIME 타입 검증
   - 파일 크기 제한
   - 악성 파일 업로드 방지

2. **권한 확인**
   - 예약 소유자만 업로드 가능
   - 관리자는 모든 사진 조회 가능

3. **파일 저장**
   - UUID 기반 파일명 생성
   - 디렉토리 구조 보안 (외부 접근 제한)

4. **개인정보 보호**
   - 사진 내 민감 정보 가이드라인 제공
   - 일정 기간 후 자동 삭제 정책

---

## 8. 테스트 계획

### 8.1 단위 테스트
- ImageService 메서드 테스트
- 파일 업로드 검증 테스트

### 8.2 통합 테스트
- 체크아웃 사진 업로드 플로우
- 사진 조회 및 권한 테스트

### 8.3 E2E 테스트
- 모바일 카메라 촬영 테스트
- 다양한 이미지 포맷 테스트

---

## 9. 배포 고려사항

### 9.1 디렉토리 생성
```bash
mkdir -p uploads/checkout-photos
chmod 755 uploads
```

### 9.2 환경 변수
```env
UPLOAD_DIR=./uploads/checkout-photos
MAX_FILE_SIZE=5242880  # 5MB
```

### 9.3 클라우드 스토리지 확장 (선택)
- AWS S3, Google Cloud Storage, Azure Blob 등
- Multer-S3 어댑터 사용

---

## 10. 타임라인

### Phase 1: Backend 구현 ✅ (완료)
- [x] DB 스키마 마이그레이션 (Reservation 엔티티 4개 필드 추가)
- [x] 파일 업로드 설정 (multer.config.ts)
- [x] ImageService 구현 (Sharp 동적 로딩)
- [x] API 엔드포인트 구현 (upload, get, delete)

### Phase 2: Frontend 구현 ✅ (완료)
- [x] 체크아웃 사진 업로드 컴포넌트 (CheckoutPhotoUpload)
- [x] 사진 조회 컴포넌트 (CheckoutPhotoView)
- [x] 예약 상세 모달 통합 (ReservationDetailModal)

### Phase 3: 테스트 및 최적화 (진행 예정)
- [ ] 단위/통합 테스트
- [ ] 이미지 최적화 검증
- [ ] 모바일 환경 테스트

### Phase 4: 배포 (진행 예정)
- [ ] 프로덕션 환경 설정
- [ ] 모니터링 설정

---

## 11. 향후 확장 가능성

1. **AI 기반 정리 상태 검증**
   - 이미지 분석으로 자동 정리 상태 확인
   - 불량 시 자동 알림

2. **사진 비교 기능**
   - 체크인/체크아웃 사진 비교
   - 손상/분실 물품 감지

3. **통계 및 리포트**
   - 회의실별 평균 정리 점수
   - 사용자별 정리 이력

4. **자동 백업**
   - 클라우드 스토리지 백업
   - 장기 보관 정책

---

## ✅ 구현 완료 (2026-01-12)

### 구현된 기능

#### Backend
1. **DB 스키마 확장** ✅
   - Reservation 엔티티에 4개 필드 추가:
     - `checkoutPhotoPath`: 파일 시스템 경로
     - `checkoutPhotoUrl`: 클라이언트 접근 URL
     - `checkoutVerifiedAt`: 체크아웃 인증 시간
     - `checkoutNotes`: 체크아웃 메모

2. **파일 업로드 시스템** ✅
   - `multer.config.ts`: 파일 업로드 설정
     - UUID 기반 파일명 생성
     - MIME 타입 검증 (JPG, PNG, WebP)
     - 최대 5MB 제한
   - `ImageService`: 이미지 처리 서비스
     - Sharp 동적 로딩 (설치 실패 시 폴백 모드)
     - 이미지 최적화 및 리사이징
     - 썸네일 생성
     - 파일 삭제 관리

3. **API 엔드포인트** ✅
   - `POST /reservations/:id/checkout-photo`: 사진 업로드
   - `GET /reservations/:id/checkout-photo`: 사진 조회
   - `DELETE /reservations/:id/checkout-photo`: 사진 삭제
   - 권한 검증: 예약 소유자만 업로드/삭제 가능

4. **정적 파일 서빙** ✅
   - Express static assets 설정
   - `/uploads/` 경로로 업로드 파일 접근

#### Frontend
1. **CheckoutPhotoUpload 컴포넌트** ✅
   - 카메라 촬영 또는 파일 선택
   - 실시간 이미지 미리보기
   - 파일 크기/형식 검증
   - 메모 입력 (최대 500자)
   - 업로드 진행 상태 표시

2. **CheckoutPhotoView 컴포넌트** ✅
   - 체크아웃 사진 표시
   - 인증 시간 표시 (한국어 포맷)
   - 메모 표시
   - 이미지 로드 에러 처리

3. **예약 상세 모달 통합** ✅
   - `finished` 상태: CheckoutPhotoView 표시
   - `confirmed` 상태 + 종료 시간 경과: CheckoutPhotoUpload 표시
   - Reservation 타입에 `finished` 상태 추가

### 파일 변경 내역

#### 신규 파일
- `backend/src/common/multer.config.ts`
- `backend/src/common/services/image.service.ts`
- `frontend/src/components/checkout/CheckoutPhotoUpload.tsx`
- `frontend/src/components/checkout/CheckoutPhotoView.tsx`

#### 수정 파일
- `backend/src/reservation/entities/reservation.entity.ts`
- `backend/src/reservation/reservation.service.ts`
- `backend/src/reservation/reservation.controller.ts`
- `backend/src/reservation/reservation.module.ts`
- `backend/src/main.ts`
- `frontend/src/components/reservations/ReservationDetailModal.tsx`
- `frontend/src/types/calendar.ts`

### 사용 방법

1. **체크아웃 사진 업로드**
   - 예약 종료 후 예약 상세 모달 열기
   - "체크아웃 인증 사진" 카드에서 사진 선택/촬영
   - 선택사항: 메모 입력 (정리 상태, 특이사항 등)
   - "체크아웃 완료" 버튼 클릭

2. **체크아웃 사진 조회**
   - finished 상태의 예약 상세 모달 열기
   - 업로드된 사진, 인증 시간, 메모 확인

3. **사진 삭제**
   - API 엔드포인트 사용: `DELETE /reservations/:id/checkout-photo`
   - 예약 소유자만 삭제 가능

### 배포 체크리스트

- [x] Reservation 엔티티 스키마 업데이트
- [x] 파일 업로드 시스템 구현
- [x] ImageService 구현 (Sharp 폴백 처리)
- [x] API 엔드포인트 구현
- [x] 프론트엔드 컴포넌트 구현
- [x] 예약 상세 모달 통합
- [ ] DB 마이그레이션 실행
- [ ] uploads 디렉토리 생성
- [ ] Sharp 모듈 설치 (선택)

### 배포 전 준비사항

1. **디렉토리 생성**
```bash
mkdir -p uploads/checkout-photos
chmod 755 uploads
```

2. **DB 마이그레이션**
```sql
ALTER TABLE reservation
ADD COLUMN checkout_photo_path VARCHAR(500) NULL,
ADD COLUMN checkout_photo_url VARCHAR(500) NULL,
ADD COLUMN checkout_verified_at TIMESTAMP NULL,
ADD COLUMN checkout_notes TEXT NULL;
```

3. **Sharp 설치 (선택사항)**
```bash
cd backend
npm install --include=optional sharp
npm rebuild sharp
```
※ Sharp 설치 실패 시에도 기능은 정상 동작 (원본 이미지 사용)

### 기술적 특징

1. **Graceful Degradation**
   - Sharp 모듈 로드 실패 시 원본 이미지 사용
   - 이미지 최적화 실패 시 폴백 처리
   - 안정적인 서비스 제공

2. **보안**
   - UUID 기반 파일명으로 충돌 방지
   - MIME 타입 검증으로 악성 파일 차단
   - 파일 크기 제한 (5MB)
   - 권한 검증 (소유자만 업로드/삭제)

3. **사용자 경험**
   - 실시간 이미지 미리보기
   - 파일 크기/형식 즉시 검증
   - 업로드 진행 상태 표시
   - 에러 처리 및 안내 메시지

### 알려진 제한사항

1. **Sharp 모듈**: Windows 환경에서 바이너리 설치 이슈 가능
   - 해결: 동적 로딩으로 선택적 사용
   - 대안: 원본 이미지 그대로 사용

2. **파일 저장소**: 현재 로컬 파일 시스템 사용
   - 확장: AWS S3, Google Cloud Storage 등으로 확장 가능

3. **썸네일**: Sharp 없이는 원본 이미지 복사
   - 확장: 클라이언트 사이드 리사이징 또는 다른 라이브러리 사용

---

**작성자**: Claude Sonnet 4.5
**구현 완료일**: 2026-01-12
**검토 완료**: Backend 및 Frontend 구현 완료, 테스트 대기
