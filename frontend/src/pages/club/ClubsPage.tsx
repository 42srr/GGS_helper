import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "../../components/layout/Header";
import { Footer } from "../../components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  User,
  Search,
  Plus,
  Clock,
  AlertCircle,
} from "lucide-react";

interface Club {
  id: number;
  name: string;
  description?: string;
  leaderId: number;
  countMember: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  leader: {
    userId: number;
    name: string;
    intraId: string;
    profileImgUrl?: string;
  };
}

export function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/clubs', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // 승인된 동아리만 표시
        setClubs(data.filter((club: Club) => club.status === 'approved'));
      }
    } catch (error) {
      console.error('Failed to fetch clubs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClubs = clubs.filter(club =>
    searchTerm === "" ||
    club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    club.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    club.leader.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">동아리 정보를 불러오는 중...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">동아리</h1>
              <p className="text-gray-600 mt-1">관심있는 동아리를 찾아 가입하세요</p>
            </div>
            <Link to="/clubs/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                동아리 생성
              </Button>
            </Link>
          </div>

          {/* 검색 바 */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="동아리명, 설명 또는 동아리장 이름으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* 통계 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">전체 동아리</p>
                    <p className="text-2xl font-bold text-blue-600">{clubs.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">총 멤버</p>
                    <p className="text-2xl font-bold text-green-600">
                      {clubs.reduce((sum, club) => sum + club.countMember, 0)}
                    </p>
                  </div>
                  <User className="w-8 h-8 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">평균 멤버</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {clubs.length > 0 ? Math.round(clubs.reduce((sum, club) => sum + club.countMember, 0) / clubs.length) : 0}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-purple-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 동아리 목록 */}
        {filteredClubs.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  {searchTerm ? "검색 결과가 없습니다." : "아직 승인된 동아리가 없습니다."}
                </p>
                <Link to="/clubs/create">
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    첫 동아리 생성하기
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClubs.map((club) => (
              <Link key={club.id} to={`/clubs/${club.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{club.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            활동중
                          </Badge>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {club.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {club.description}
                        </p>
                      )}

                      {/* 동아리장 정보 */}
                      <div className="flex items-center gap-2 pt-2 border-t">
                        {club.leader.profileImgUrl && (
                          <img
                            src={club.leader.profileImgUrl}
                            alt={club.leader.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">동아리장</p>
                          <p className="text-sm font-medium text-gray-900">
                            {club.leader.name}
                          </p>
                        </div>
                      </div>

                      {/* 멤버 수 */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="h-4 w-4 mr-2" />
                          <span>{club.countMember}명</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 h-3 mr-1" />
                          {new Date(club.createdAt).toLocaleDateString('ko-KR')}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
