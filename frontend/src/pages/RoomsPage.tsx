import { useState, useEffect } from "react";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Users,
  Search,
  Plus,
} from "lucide-react";

interface Room {
  id: number;
  name: string;
  location: string;
  capacity: number;
  description?: string;
  equipment?: string;
  isActive: boolean;
}

export function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
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
        // 활성화된 회의실만 표시
        setRooms(data.filter((room: Room) => room.isActive));
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">회의실 예약</h1>
              <p className="text-gray-600 mt-1">원하는 회의실을 검색하고 예약하세요</p>
            </div>
          </div>

          {/* 검색 바 */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-6">
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

        {/* 회의실 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <Card key={room.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{room.name}</CardTitle>
                  <Badge variant="default">사용 가능</Badge>
                </div>
                <CardDescription className="flex items-center text-sm text-gray-500">
                  <MapPin className="h-4 w-4 mr-1" />
                  {room.location}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Users className="h-4 w-4 mr-2 text-gray-400" />
                    <span>최대 {room.capacity}명</span>
                  </div>

                  {room.description && (
                    <div className="text-sm text-gray-600">
                      <p>{room.description}</p>
                    </div>
                  )}

                  {room.equipment && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">보유 장비: </span>
                      <span className="text-gray-600">{room.equipment}</span>
                    </div>
                  )}

                  <div className="flex pt-4">
                    <Button
                      className="w-full"
                      onClick={() => window.location.href = `/create-reservation?roomId=${room.id}`}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      예약하기
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {rooms.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">사용 가능한 회의실이 없습니다.</p>
            <p className="text-gray-400 text-sm mt-2">다른 키워드로 검색해보세요.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}