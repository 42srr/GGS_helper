import { useState } from 'react';
import { Calendar, Clock, MapPin, User, X, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const API_BASE_URL = 'http://localhost:3001';

interface Room {
  roomId: number;
  name: string;
  location: string;
  capacity: number;
  equipment?: string;
  description?: string;
  isAvailable?: boolean;
}

interface Reservation {
  reservationId: number;
  roomId: number;
  userId: number;
  title: string;
  description?: string;
  startTime: Date | string;
  endTime: Date | string;
  createdAt?: Date | string;
  isNoShow?: boolean;
  noShowReportCount?: number;
  room?: {
    roomId: number;
    name: string;
    location: string;
  };
  user?: {
    userId: number;
    name?: string;
    login?: string;
  };
}

interface ReservationDetailModalProps {
  reservation: Reservation | null;
  room?: Room | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReservationDetailModal({
  reservation,
  room,
  isOpen,
  onClose
}: ReservationDetailModalProps) {
  const [isReporting, setIsReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  if (!reservation || !room) return null;

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getDuration = () => {
    const startTime = typeof reservation.startTime === 'string' ? new Date(reservation.startTime) : reservation.startTime;
    const endTime = typeof reservation.endTime === 'string' ? new Date(reservation.endTime) : reservation.endTime;
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return diffMinutes > 0 ? `${diffHours}시간 ${diffMinutes}분` : `${diffHours}시간`;
    }
    return `${diffMinutes}분`;
  };

  const handleNoShowReport = async () => {
    if (!reservation) return;

    setIsReporting(true);
    setReportError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/reservations/${reservation.reservationId}/no-show`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '노쇼 신고에 실패했습니다.');
      }

      setReportSuccess(true);
      setTimeout(() => {
        onClose();
        setReportSuccess(false);
      }, 2000);
    } catch (err) {
      setReportError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsReporting(false);
    }
  };

  const canReportNoShow = () => {
    if (!reservation) return false;
    const now = new Date();
    const endTime = typeof reservation.endTime === 'string' ? new Date(reservation.endTime) : reservation.endTime;
    // 예약 종료 시간이 지났고, 아직 노쇼 신고되지 않은 경우
    return endTime <= now && !reservation.isNoShow;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>예약 상세 정보</DialogTitle>
          <DialogDescription>
            예약의 상세 정보를 확인할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 예약 제목 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {reservation.title}
            </h3>
            {reservation.description && (
              <p className="text-gray-600 text-sm">
                {reservation.description}
              </p>
            )}
          </div>

          {/* 예약자 정보 */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <User className="w-5 h-5 text-gray-600" />
            <div>
              <p className="font-medium text-gray-900">{reservation.user?.name || reservation.user?.login || '알 수 없음'}</p>
              <p className="text-sm text-gray-600">예약자</p>
            </div>
          </div>

          {/* 날짜 및 시간 정보 */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">
                  {formatDate(reservation.startTime)}
                </p>
                <p className="text-sm text-gray-600">예약 날짜</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">
                  {formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}
                </p>
                <p className="text-sm text-gray-600">예약 시간 ({getDuration()})</p>
              </div>
            </div>
          </div>

          {/* 회의실 정보 */}
          <div className="border-t pt-4">
            <div className="flex items-center space-x-3 mb-3">
              <MapPin className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">{room.name}</p>
                <p className="text-sm text-gray-600">{room.location} · 최대 {room.capacity}명</p>
              </div>
            </div>

            {room.description && (
              <p className="text-sm text-gray-600 mb-3">{room.description}</p>
            )}

            {room.equipment && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">이용 가능한 장비</p>
                <div className="text-sm text-gray-600">
                  {room.equipment}
                </div>
              </div>
            )}
          </div>

          {/* 노쇼 상태 표시 */}
          {reservation.isNoShow && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-semibold">노쇼 신고됨</span>
              </div>
              {reservation.noShowReportCount && reservation.noShowReportCount > 1 && (
                <p className="text-sm text-red-600 mt-1">
                  신고 횟수: {reservation.noShowReportCount}회
                </p>
              )}
            </div>
          )}

          {/* 성공/에러 메시지 */}
          {reportSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <p className="text-green-800 font-medium">노쇼 신고가 완료되었습니다.</p>
            </div>
          )}

          {reportError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
              <p className="text-red-800 text-sm">{reportError}</p>
            </div>
          )}

          {/* 예약 생성 정보 */}
          {reservation.createdAt && (
            <div className="text-xs text-gray-500 pt-2 border-t">
              예약 생성: {formatDate(reservation.createdAt)} {formatTime(reservation.createdAt)}
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex gap-2 pt-2">
            {!reservation.isNoShow && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleNoShowReport}
                disabled={isReporting || !canReportNoShow()}
                className="flex-1"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                {isReporting ? '신고 중...' : '노쇼 신고'}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
              className={!reservation.isNoShow ? "flex-1" : "w-full"}
            >
              <X className="w-4 h-4 mr-2" />
              닫기
            </Button>
          </div>

          {/* 노쇼 신고 안내 */}
          {!reservation.isNoShow && !canReportNoShow() && (
            <p className="text-xs text-gray-500 text-center -mt-2">
              * 예약 종료 시간 이후에 노쇼 신고가 가능합니다.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
