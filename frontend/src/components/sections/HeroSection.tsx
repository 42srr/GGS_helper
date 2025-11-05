import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Clock, Shield } from "lucide-react";

export function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            42경산 캠퍼스
            <br />
            <span className="text-blue-600">동아리 & 회의실 관리</span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            효율적인 동아리 활동 관리와 간편한 회의실 예약을 위한
            올인원 플랫폼입니다.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/reservations">
              <Button size="lg" className="text-lg px-8 py-6 w-full sm:w-auto">
                시작하기
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              더 알아보기
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">동아리 관리</h3>
              <p className="text-sm text-gray-600">효율적인 동아리 운영</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">회의실 예약</h3>
              <p className="text-sm text-gray-600">간편한 공간 예약</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">실시간 현황</h3>
              <p className="text-sm text-gray-600">즉시 확인 가능</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">보안 인증</h3>
              <p className="text-sm text-gray-600">42 OAuth 연동</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}