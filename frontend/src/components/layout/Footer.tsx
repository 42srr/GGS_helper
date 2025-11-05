import { Github, Mail, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">42</span>
              </div>
              <span className="text-xl font-bold">42경산 캠퍼스</span>
            </div>
            <p className="text-gray-300 mb-6 max-w-md">
              효율적인 동아리 관리와 회의실 예약을 위한 올인원 플랫폼으로
              42경산 캠퍼스의 학습 환경을 더욱 발전시켜 나갑니다.
            </p>
            <div className="flex items-center space-x-2 text-gray-300">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">경상북도 경산시 진량읍 대구대로 201길 42</span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">서비스</h3>
            <ul className="space-y-2 text-gray-300">
              <li>
                <a href="#" className="hover:text-white transition-colors">동아리 관리</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">회의실 예약</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">멤버 관리</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">예약 현황</a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">지원</h3>
            <ul className="space-y-2 text-gray-300">
              <li>
                <a href="#" className="hover:text-white transition-colors">도움말</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">문의하기</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">FAQ</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">이용약관</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 42경산 캠퍼스. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}