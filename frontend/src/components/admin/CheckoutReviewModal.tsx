import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, User, Camera, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface CheckoutReviewModalProps {
  reservation: {
    reservationId: number;
    title: string;
    room: {
      name: string;
      location: string;
    };
    user: {
      login?: string;
      name?: string;
      email?: string;
    };
    startTime: string;
    endTime: string;
    checkoutPhotoUrl?: string;
    checkoutVerifiedAt?: string;
    checkoutNotes?: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export const CheckoutReviewModal: React.FC<CheckoutReviewModalProps> = ({
  reservation,
  isOpen,
  onClose,
}) => {
  const [photoData, setPhotoData] = useState<{
    photoUrl: string;
    verifiedAt: string;
    notes: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && reservation.reservationId) {
      fetchCheckoutPhoto();
    }
  }, [isOpen, reservation.reservationId]);

  const fetchCheckoutPhoto = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/reservations/${reservation.reservationId}/checkout-photo`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.hasPhoto) {
          setPhotoData({
            photoUrl: data.photoUrl,
            verifiedAt: data.verifiedAt,
            notes: data.notes || '',
          });
        } else {
          setError('체크아웃 사진이 업로드되지 않았습니다.');
        }
      } else {
        setError('체크아웃 정보를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('Failed to fetch checkout photo:', err);
      setError('체크아웃 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">체크아웃 검수</h2>
            <p className="text-sm text-gray-600 mt-1">
              예약 ID #{reservation.reservationId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6">
          {/* 예약 정보 섹션 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              예약 정보
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start">
                <Calendar className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-blue-900 font-medium">예약 제목</p>
                  <p className="text-blue-700">{reservation.title}</p>
                </div>
              </div>
              <div className="flex items-start">
                <MapPin className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-blue-900 font-medium">회의실</p>
                  <p className="text-blue-700">{reservation.room.name}</p>
                  <p className="text-blue-600 text-xs">{reservation.room.location}</p>
                </div>
              </div>
              <div className="flex items-start">
                <User className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-blue-900 font-medium">예약자</p>
                  <p className="text-blue-700">
                    {reservation.user.name || reservation.user.login}
                  </p>
                  {reservation.user.email && (
                    <p className="text-blue-600 text-xs">{reservation.user.email}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start">
                <Clock className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-blue-900 font-medium">사용 시간</p>
                  <p className="text-blue-700">
                    {formatDateTime(reservation.startTime)}
                  </p>
                  <p className="text-blue-700">
                    ~ {formatDateTime(reservation.endTime)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 로딩 상태 */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">체크아웃 정보를 불러오는 중...</p>
              </div>
            </div>
          )}

          {/* 에러 상태 */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* 체크아웃 정보 */}
          {!loading && !error && photoData && (
            <>
              {/* 업로드 시각 */}
              <div className="mb-4">
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <Camera className="w-3 h-3 mr-1" />
                  {formatDateTime(photoData.verifiedAt)}에 업로드됨
                </Badge>
              </div>

              {/* 체크아웃 사진 */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Camera className="w-5 h-5 mr-2" />
                  체크아웃 사진
                </h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                  <img
                    src={`${import.meta.env.VITE_API_BASE_URL}${photoData.photoUrl}`}
                    alt="체크아웃 사진"
                    className="w-full h-auto object-contain max-h-96"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-image.png';
                      target.alt = '이미지를 불러올 수 없습니다';
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  * 이미지를 클릭하여 새 탭에서 원본 크기로 볼 수 있습니다
                </p>
                <a
                  href={`${import.meta.env.VITE_API_BASE_URL}${photoData.photoUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  새 탭에서 원본 보기
                </a>
              </div>

              {/* 전달사항 */}
              {photoData.notes && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    전달사항
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{photoData.notes}</p>
                </div>
              )}

              {!photoData.notes && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-500 text-sm text-center">
                    전달사항이 없습니다.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
        </div>
      </div>
    </div>
  );
};
