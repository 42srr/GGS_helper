/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#111827',      // Near Black - 주요 텍스트, 헤더
        secondary: '#374151',    // 보조 텍스트, 비활성 요소
        accent: '#0EA5E9',       // 시원한 포인트 - 버튼, 링크, 강조
        background: '#FFFFFF',   // 페이지 배경
        surface: '#F3F4F6',      // 카드, 패널 배경
        line: '#D1D5DB',         // 구분선, 테두리
      },
    },
  },
  plugins: [],
}