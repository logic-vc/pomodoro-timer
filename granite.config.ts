import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'pomodoro-timer', // 앱인토스 콘솔에서 설정한 앱 이름
  brand: {
    displayName: '포모도로 타이머', // 화면에 노출될 앱의 한글 이름
    primaryColor: '#6366F1', // 앱의 기본 색상 (보라색 계열)
    icon: '', // 화면에 노출될 앱의 아이콘 이미지 주소 (나중에 추가)
  },
  web: {
    host: 'localhost', // 앱 내 웹뷰에 사용될 host
    port: 5173,
    commands: {
      dev: 'vite', // 개발 모드 실행
      build: 'vite build', // 빌드 명령어
    },
  },
  permissions: [],
});
