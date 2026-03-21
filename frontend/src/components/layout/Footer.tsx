export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <img src="/logo.png" alt="룸잇" className="w-8 h-8 rounded-lg" width={32} height={32} loading="lazy" />
            <span className="text-xl font-bold">룸잇</span>
          </div>
          <p className="text-gray-300 max-w-md">
            효율적인 회의실 예약을 위한 올인원 플랫폼으로
            42경산 캠퍼스의 학습 환경을 더욱 발전시켜 나갑니다.
          </p>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <p className="text-gray-400 text-sm">
            © 2025 42GGS. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
