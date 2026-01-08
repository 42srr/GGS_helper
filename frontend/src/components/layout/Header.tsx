import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Calendar, Plus, Clock, ChevronDown, User, LogOut, Shield } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export function Header() {
  const location = useLocation();
  const { user, isAuthenticated, logout, isAdmin } = useAuth();

  return (
    <header className="border-b border-line bg-primary">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <img src="/logo.png" alt="룸잇" className="w-8 h-8 rounded-lg" />
          <span className="text-xl font-bold text-white">룸잇</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          {/* 예약 드롭다운 메뉴 */}
          <DropdownMenu>
            <DropdownMenuTrigger className={`flex items-center space-x-1 transition-colors hover:text-accent ${
              location.pathname.startsWith('/reservations') || location.pathname === '/create-reservation' || location.pathname === '/my-reservations'
                ? 'text-accent font-medium'
                : 'text-white'
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
                  ? 'text-accent font-medium'
                  : 'text-white hover:text-accent'
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
                    <User className="w-4 h-4" />
                    <span className="hidden md:inline">
                      {user?.name || user?.username}
                    </span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <div className="flex flex-col items-start px-2 py-2">
                      <span className="font-medium text-primary">{user?.name || user?.username}</span>
                      <span className="text-xs text-secondary">{user?.email}</span>
                      <span className="text-xs text-accent font-medium">{user?.role}</span>
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