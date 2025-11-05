import { useState } from 'react';
import { Calendar, Clock, MapPin, User, X, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const API_BASE_URL = 'http://localhost:3001';

interface Reservation {
  reservationId: number;
  roomId: number;
  roomName?: string;
  userId: number;
  userName?: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  status?: 'confirmed' | 'pending' | 'cancelled';
  createdAt?: Date;
  isNoShow?: boolean;
  noShowReportCount?: number;
}

interface PublicReservationDetailModalProps {
  reservation: Reservation | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PublicReservationDetailModal({
  reservation,
  isOpen,
  onClose
}: PublicReservationDetailModalProps) {
  const [isReporting, setIsReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  if (!reservation) return null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getDuration = () => {
    const diffMs = reservation.endTime.getTime() - reservation.startTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return diffMinutes > 0 ? `${diffHours}시간 ${diffMinutes}분` : `${diffHours}시간`;
    }
    return `${diffMinutes}분`;
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">확정</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">대기</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-200">취소</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">알 수 없음</Badge>;
    }
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
    return reservation.startTime <= now && !reservation.isNoShow;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl flex items-center justify-between">
            <span>예약 상세 정보</span>
            {getStatusBadge(reservation.status)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 mt-4">
          {/* 예약 제목 */}
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              {reservation.title}
            </h3>
            {reservation.description && (
              <p className="text-sm sm:text-base text-gray-600">
                {reservation.description}
              </p>
            )}
          </div>

          {/* 예약자 정보 */}
          {reservation.userName && (
            <div className="flex items-center space-x-3 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="bg-blue-100 p-2 rounded-full">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">예약자</p>
                <p className="font-medium text-gray-900">{reservation.userName}</p>
              </div>
            </div>
          )}

          {/* 날짜 및 시간 정보 */}
          <div className="space-y-3 bg-gray-50 p-3 sm:p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="bg-white p-2 rounded-full">
                <Calendar className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">날짜</p>
                <p className="font-medium text-gray-900 text-sm sm:text-base">
                  {formatDate(reservation.startTime)}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="bg-white p-2 rounded-full">
                <Clock className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">시간</p>
                <p className="font-medium text-gray-900 text-sm sm:text-base">
                  {formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  총 {getDuration()}
                </p>
              </div>
            </div>

            {reservation.roomName && (
              <div className="flex items-start space-x-3">
                <div className="bg-white p-2 rounded-full">
                  <MapPin className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">회의실</p>
                  <p className="font-medium text-gray-900 text-sm sm:text-base">
                    {reservation.roomName}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 노쇼 상태 표시 */}
          {reservation.isNoShow && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
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
            <div className="text-xs sm:text-sm text-gray-500 pt-2 border-t">
              예약 생성: {formatDate(reservation.createdAt)} {formatTime(reservation.createdAt)}
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex gap-2 pt-2">
            {canReportNoShow() && (
              <Button
                variant="outline"
                onClick={handleNoShowReport}
                disabled={isReporting}
                className="flex-1"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                {isReporting ? '신고 중...' : '노쇼 신고'}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              닫기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
