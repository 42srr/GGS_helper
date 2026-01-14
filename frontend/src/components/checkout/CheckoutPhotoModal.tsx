import React, { useState } from 'react';
import { X, Camera, Upload, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';

interface CheckoutPhotoModalProps {
  reservation: {
    reservationId: number;
    roomName: string;
    title: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CheckoutPhotoModal: React.FC<CheckoutPhotoModalProps> = ({
  reservation,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 파일 크기 확인 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('파일 크기는 5MB 이하여야 합니다.');
        return;
      }

      // 파일 타입 확인
      if (!file.type.match(/^image\/(jpg|jpeg|png|webp)$/)) {
        setError('JPG, PNG, WebP 형식의 이미지만 업로드 가능합니다.');
        return;
      }

      setSelectedFile(file);
      setError(null);

      // 미리보기 생성
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('사진을 선택해주세요.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);
      if (notes) {
        formData.append('notes', notes);
      }

      const response = await fetch(
        `http://localhost:3001/reservations/${reservation.reservationId}/checkout-photo`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        onSuccess();
      } else {
        const errorData = await response.json();
        setError(errorData.message || '업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              체크아웃 사진 업로드
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {reservation.roomName} - {reservation.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={uploading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 안내 메시지 */}
        <div className="p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">
                  체크아웃 사진 업로드가 필수입니다
                </p>
                <p className="text-blue-700">
                  회의실 반납을 완료하려면 회의실 상태 사진을 업로드해야 합니다.
                  <br />
                  깨끗하게 정리된 회의실 전체가 보이도록 촬영해주세요.
                </p>
              </div>
            </div>
          </div>

          {/* 파일 업로드 영역 */}
          {!preview ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                회의실 상태 사진을 업로드해주세요
              </p>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
                id="photo-upload-input"
                disabled={uploading}
              />
              <label htmlFor="photo-upload-input">
                <div className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 bg-accent text-white hover:bg-accent/90 cursor-pointer transition-all disabled:pointer-events-none disabled:opacity-50">
                  <Upload className="w-4 h-4" />
                  사진 선택
                </div>
              </label>
              <p className="text-xs text-gray-500 mt-2">
                JPG, PNG, WebP (최대 5MB)
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
              <button
                onClick={() => {
                  setPreview(null);
                  setSelectedFile(null);
                }}
                className="text-sm text-blue-600 hover:text-blue-700"
                disabled={uploading}
              >
                다른 사진 선택
              </button>
            </div>
          )}

          {/* 메모 입력 */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              메모 (선택사항)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="특이사항이나 전달할 내용을 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              disabled={uploading}
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={uploading}
          >
            취소
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                업로드 중...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                업로드 및 반납 완료
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
