import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  MapPin,
  Users,
  Search,
  Plus,
  Download,
  Upload,
  Edit,
  Trash2,
  ArrowLeft,
} from 'lucide-react';

interface Room {
  roomId: number;
  name: string;
  location: string;
  capacity: number;
  description?: string;
  equipment?: string;
  isAvailable: boolean;
  isConfirm?: boolean;
}

export function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    location: '',
    capacity: '',
    description: '',
    equipment: '',
    isAvailable: true,
    isConfirm: true,
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async (search?: string) => {
    try {
      setLoading(true);
      const url = search
        ? `${import.meta.env.VITE_API_BASE_URL}/rooms?includeInactive=true&search=${encodeURIComponent(search)}`
        : `${import.meta.env.VITE_API_BASE_URL}/rooms?includeInactive=true`;

      const response = await fetch(url, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      }
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRooms(searchTerm);
  };

  const handleDelete = async (roomId: number) => {
    if (!confirm('정말로 이 회의실을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/rooms/${roomId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        alert('회의실이 삭제되었습니다.');
        fetchRooms();
      } else {
        alert('회의실 삭제에 실패했습니다.');
      }
    } catch (error) {

      alert('회의실 삭제 중 오류가 발생했습니다.');
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/rooms/template`, {
        credentials: 'include',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'room_template.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {

    }
  };

  const exportRooms = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/rooms/export`, {
        credentials: 'include',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'rooms_export.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {

    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 유효성 검사
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      alert('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.');
      event.target.value = ''; // 파일 입력 초기화
      return;
    }

    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기가 10MB를 초과합니다.');
      event.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    // 백엔드 서버 연결 상태 확인
    try {

      const healthCheck = await fetch(`${import.meta.env.VITE_API_BASE_URL}/rooms`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!healthCheck.ok) {
        alert('서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.');
        return;
      }
    } catch (error) {

      alert('서버 연결 실패. 백엔드 서버가 실행 중인지 확인해주세요.');
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30초 타임아웃

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/rooms/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();

        alert(`업로드 완료!\n성공: ${result.success}개\n오류: ${result.errors.length}개\n대체: ${result.replaced || 0}개`);
        if (result.errors.length > 0) {

        }
        fetchRooms();
      } else {
        const errorText = await response.text();

        alert(`업로드 실패: ${response.status} ${response.statusText}\n${errorText}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {

          alert('요청 시간이 초과되었습니다. 파일 크기를 확인하거나 다시 시도해주세요.');
        } else {

          alert(`업로드 중 오류가 발생했습니다: ${error.message}`);
        }
      } else {

        alert('업로드 중 알 수 없는 오류가 발생했습니다.');
      }
    }

    event.target.value = '';
  };

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    setEditFormData({
      name: room.name,
      location: room.location,
      capacity: String(room.capacity),
      description: room.description || '',
      equipment: room.equipment || '',
      isAvailable: room.isAvailable,
      isConfirm: room.isConfirm ?? true,
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;

    setEditSubmitting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/rooms/${editingRoom.roomId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
        credentials: 'include',
        body: JSON.stringify({
            name: editFormData.name,
            location: editFormData.location,
            capacity: parseInt(editFormData.capacity),
            description: editFormData.description || undefined,
            equipment: editFormData.equipment || undefined,
            isAvailable: editFormData.isAvailable,
            isConfirm: editFormData.isConfirm,
          }),
        },
      );

      if (response.ok) {
        alert('회의실 정보가 수정되었습니다.');
        setEditingRoom(null);
        fetchRooms();
      } else {
        const error = await response.json();
        alert(`수정 실패: ${error.message || '알 수 없는 오류가 발생했습니다.'}`);
      }
    } catch (error) {
      alert('회의실 수정 중 오류가 발생했습니다.');
    } finally {
      setEditSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">회의실 정보를 불러오는 중...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* 헤더 섹션 */}
        <div className="mb-8">
          <Link to="/admin">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              관리자 대시보드로 돌아가기
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">회의실 관리</h1>
              <p className="text-gray-600 mt-1">회의실을 추가, 수정, 삭제하고 Excel로 관리하세요</p>
            </div>
            <div className="flex items-center space-x-3">
              <Link to="/create-room">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  새 회의실
                </Button>
              </Link>
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                템플릿 다운로드
              </Button>
              <Button variant="outline" onClick={exportRooms}>
                <Download className="h-4 w-4 mr-2" />
                Excel 내보내기
              </Button>
              <div className="relative">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Excel 업로드
                </Button>
              </div>
            </div>
          </div>

          {/* 검색 바 */}
          <form onSubmit={handleSearch} className="flex gap-2 mt-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="회의실명, 위치 또는 설명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">검색</Button>
          </form>
        </div>

        {/* 회의실 테이블 */}
        <Card>
          <CardHeader>
            <CardTitle>전체 회의실 목록</CardTitle>
            <CardDescription>총 {rooms.length}개의 회의실</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">회의실명</th>
                    <th className="text-left p-4">위치</th>
                    <th className="text-left p-4">수용인원</th>
                    <th className="text-left p-4">장비</th>
                    <th className="text-left p-4">상태</th>
                    <th className="text-left p-4">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => (
                    <tr key={room.roomId} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">{room.name}</td>
                      <td className="p-4">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                          {room.location}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1 text-gray-400" />
                          최대 {room.capacity}명
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-gray-600">
                          {room.equipment || '-'}
                        </span>
                      </td>
                      <td className="p-4">
                        {room.isAvailable ? (
                          <Badge className="bg-green-600 text-white hover:bg-green-700">사용 가능</Badge>
                        ) : (
                          <Badge className="bg-red-600 text-white hover:bg-red-700">사용 불가</Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => openEditModal(room)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(room.roomId)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {rooms.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">검색 결과가 없습니다.</p>
                <p className="text-gray-400 text-sm mt-2">다른 키워드로 검색해보세요.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />

      {/* 회의실 수정 모달 */}
      <Dialog open={!!editingRoom} onOpenChange={(open) => !open && setEditingRoom(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>회의실 정보 수정</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">회의실명 *</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-location">위치 *</Label>
                <Input
                  id="edit-location"
                  value={editFormData.location}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, location: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-capacity">수용 인원 *</Label>
                <Input
                  id="edit-capacity"
                  type="number"
                  min="1"
                  value={editFormData.capacity}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, capacity: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-description">설명</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-equipment">보유 장비</Label>
              <Input
                id="edit-equipment"
                value={editFormData.equipment}
                onChange={(e) => setEditFormData(prev => ({ ...prev, equipment: e.target.value }))}
                placeholder="예: 프로젝터, 화이트보드, 스피커"
              />
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="edit-isAvailable"
                checked={editFormData.isAvailable}
                onChange={(e) => setEditFormData(prev => ({ ...prev, isAvailable: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="flex-1">
                <Label htmlFor="edit-isAvailable" className="text-sm font-medium cursor-pointer">
                  회의실 활성화
                </Label>
                <p className="text-xs text-gray-500 mt-1">비활성화하면 예약할 수 없습니다</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
              <input
                type="checkbox"
                id="edit-isConfirm"
                checked={editFormData.isConfirm}
                onChange={(e) => setEditFormData(prev => ({ ...prev, isConfirm: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="flex-1">
                <Label htmlFor="edit-isConfirm" className="text-sm font-medium cursor-pointer">
                  관리자 승인 필요
                </Label>
                <p className="text-xs text-gray-500 mt-1">체크하면 예약 시 관리자 승인이 필요합니다</p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingRoom(null)}>
                취소
              </Button>
              <Button
                type="submit"
                disabled={!editFormData.name || !editFormData.location || !editFormData.capacity || editSubmitting}
              >
                {editSubmitting ? '수정 중...' : '수정 완료'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}