import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Upload, X, CheckCircle, RefreshCw } from 'lucide-react';

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
      // 파일 크기 체크 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.');
        return;
      }

      // 파일 타입 체크
      if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
        alert('JPG, PNG, WebP 이미지 파일만 업로드 가능합니다.');
        return;
      }

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
        `${import.meta.env.VITE_API_BASE_URL}/reservations/${reservationId}/checkout-photo`,
        {
        method: 'POST',
          credentials: 'include',
          body: formData,
        }
      );

      if (response.ok) {
        alert('✅ 체크아웃 인증이 완료되었습니다.');
        onUploadSuccess();
      } else {
        const error = await response.json();
        alert(`❌ 업로드 실패: ${error.message || '알 수 없는 오류'}`);
      }
    } catch (error) {

      alert('업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    setNotes('');
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
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
              <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">
                회의실 정리 상태를 촬영해주세요
              </p>
              <p className="text-sm text-gray-500 mb-4">
                JPG, PNG, WebP (최대 5MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
                id="photo-input"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
              >
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {notes.length} / 500
              </p>
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
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  업로드 중...
                </>
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
