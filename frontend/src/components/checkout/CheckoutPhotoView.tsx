import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Calendar, FileText } from 'lucide-react';

interface CheckoutPhotoViewProps {
  reservationId: number;
}

interface PhotoData {
  hasPhoto: boolean;
  photoUrl?: string;
  verifiedAt?: string;
  notes?: string;
  message?: string;
}

export function CheckoutPhotoView({ reservationId }: CheckoutPhotoViewProps) {
  const [photoData, setPhotoData] = useState<PhotoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    fetchCheckoutPhoto();
  }, [reservationId]);

  const fetchCheckoutPhoto = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/reservations/${reservationId}/checkout-photo`,
        {
          credentials: 'include',
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPhotoData(data);
      }
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">로딩 중...</p>
        </CardContent>
      </Card>
    );
  }

  if (!photoData?.hasPhoto) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Camera className="w-5 h-5 mr-2" />
            체크아웃 인증 사진
          </CardTitle>
        </CardHeader>
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
        <div className="space-y-4">
          {/* 사진 표시 */}
          {!imageError ? (
            <img
              src={`${import.meta.env.VITE_API_BASE_URL}${photoData.photoUrl}`}
              alt="Checkout verification"
              className="w-full rounded-lg shadow-md"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Camera className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <p className="text-gray-500">이미지를 불러올 수 없습니다.</p>
              </div>
            </div>
          )}

          {/* 인증 시간 */}
          {photoData.verifiedAt && (
            <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
              <Calendar className="w-4 h-4 mr-2" />
              <div>
                <p className="font-medium">체크아웃 시간</p>
                <p>{formatDate(photoData.verifiedAt)}</p>
              </div>
            </div>
          )}

          {/* 메모 */}
          {photoData.notes && (
            <div className="bg-blue-50 p-3 rounded-md">
              <div className="flex items-start">
                <FileText className="w-4 h-4 mr-2 mt-0.5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 mb-1">메모</p>
                  <p className="text-sm text-blue-800 whitespace-pre-wrap">
                    {photoData.notes}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
