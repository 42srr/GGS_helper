import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Calendar, Plus, Clock, ChevronDown, User, LogOut, BarChart3, MapPin, Shield, Users } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export function Header() {
  const location = useLocation();
  const { user, isAuthenticated, logout, login, isAdmin } = useAuth();

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">42</span>
          </div>
          <span className="text-xl font-bold">경산 캠퍼스</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          {isAuthenticated && (
            <Link
              to="/dashboard"
              className={`flex items-center space-x-1 transition-colors ${
                location.pathname === '/dashboard'
                  ? 'text-blue-600 font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>대시보드</span>
            </Link>
          )}

          {/* 예약 드롭다운 메뉴 */}
          <DropdownMenu>
            <DropdownMenuTrigger className={`flex items-center space-x-1 transition-colors hover:text-gray-900 ${
              location.pathname.startsWith('/reservations') || location.pathname === '/create-reservation' || location.pathname === '/my-reservations'
                ? 'text-blue-600 font-medium'
                : 'text-gray-600'
            }`}>
              <Calendar className="w-4 h-4" />
              <span>예약</span>
              <ChevronDown className="w-3 h-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 py-2">
              <DropdownMenuItem asChild className="my-1">
                <Link to="/reservations" className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  예약 현황
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="my-1">
                <Link to="/create-reservation" className="flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  새 예약
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="my-1">
                <Link to="/my-reservations" className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  내 예약
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 관리자 메뉴 - 관리자에게만 표시 */}
          {isAuthenticated && isAdmin() && (
            <Link
              to="/admin"
              className={`flex items-center space-x-1 transition-colors ${
                location.pathname.startsWith('/admin')
                  ? 'text-red-600 font-medium'
                  : 'text-gray-600 hover:text-red-600'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>관리자</span>
            </Link>
          )}
        </nav>

        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <Link to="/create-reservation">
                <Button size="sm" className="flex items-center">
                  <Plus className="w-4 h-4 mr-1" />
                  예약하기
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center space-x-2">
                    {user?.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt={user.displayName || user.login}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                    <span className="hidden md:inline">
                      {user?.displayName || user?.login}
                    </span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <div className="flex flex-col items-start px-2 py-2">
                      <span className="font-medium">{user?.displayName || user?.login}</span>
                      <span className="text-xs text-gray-500">{user?.email}</span>
                      <span className="text-xs text-blue-600 font-medium">{user?.role}</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {isAdmin() && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center">
                          <Shield className="w-4 h-4 mr-2" />
                          관리자 대시보드
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={logout} className="flex items-center">
                    <LogOut className="w-4 h-4 mr-2" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center space-x-1">
                    <span>로그인</span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem asChild>
                    <Link to="/login" className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      일반 로그인
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/admin/login" className="flex items-center">
                      <Shield className="w-4 h-4 mr-2" />
                      관리자 로그인
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </header>
  );
}