import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  isActive: boolean;
}

export function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async (search?: string) => {
    try {
      setLoading(true);
      const url = search
        ? `http://localhost:3001/rooms?search=${encodeURIComponent(search)}`
        : 'http://localhost:3001/rooms';

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
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
      const response = await fetch(`http://localhost:3001/rooms/${roomId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        alert('회의실이 삭제되었습니다.');
        fetchRooms();
      } else {
        alert('회의실 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Delete room error:', error);
      alert('회의실 삭제 중 오류가 발생했습니다.');
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('http://localhost:3001/rooms/template', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
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
      console.error('Failed to download template:', error);
    }
  };

  const exportRooms = async () => {
    try {
      const response = await fetch('http://localhost:3001/rooms/export', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
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
      console.error('Failed to export rooms:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('Selected file:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });

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

    console.log('Sending upload request...');

    // 백엔드 서버 연결 상태 확인
    try {
      console.log('Checking server connection...');
      const healthCheck = await fetch('http://localhost:3001/rooms', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      console.log('Server connection status:', healthCheck.status);

      if (!healthCheck.ok) {
        alert('서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.');
        return;
      }
    } catch (error) {
      console.error('Server connection error:', error);
      alert('서버 연결 실패. 백엔드 서버가 실행 중인지 확인해주세요.');
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30초 타임아웃

      const response = await fetch('http://localhost:3001/rooms/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const result = await response.json();
        console.log('Upload result:', result);
        alert(`업로드 완료!\n성공: ${result.success}개\n오류: ${result.errors.length}개\n대체: ${result.replaced || 0}개`);
        if (result.errors.length > 0) {
          console.log('Errors:', result.errors);
        }
        fetchRooms();
      } else {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        alert(`업로드 실패: ${response.status} ${response.statusText}\n${errorText}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('Request timeout');
          alert('요청 시간이 초과되었습니다. 파일 크기를 확인하거나 다시 시도해주세요.');
        } else {
          console.error('Upload error:', error);
          alert(`업로드 중 오류가 발생했습니다: ${error.message}`);
        }
      } else {
        console.error('Unknown error:', error);
        alert('업로드 중 알 수 없는 오류가 발생했습니다.');
      }
    }

    event.target.value = '';
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
                        {room.isActive ? (
                          <Badge variant="default">사용 가능</Badge>
                        ) : (
                          <Badge variant="secondary">사용 불가</Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
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
    </div>
  );
}