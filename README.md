# PasteQR

[English](#english) | [한국어](#korean)

## English

> **Extract QR codes instantly from images, without a camera**

If you took a screenshot or already have an image containing a QR code, you can pull the information out immediately without a camera or smartphone.  
With a single paste (`Ctrl+V`), instantly check the URL or text inside the QR code.

---

## ✨ Why PasteQR?

Traditional QR scanners require you to point a camera at the code. But most of the time, we encounter QR codes **inside images**.

- QR images received through KakaoTalk
- QR codes inside website screenshots
- QR codes embedded in PDFs and documents
- Saved QR image files

**PasteQR** solves all of these cases. Just paste or upload an image and you're done.

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev
```

Open http://localhost:3000 in your browser.

```bash
# Production build
npm run build && npm start
```

---

## 🛠️ How to Use

| Method | Step |
|---|---|
| **Paste** | Copy a QR image, then press `Ctrl+V` (fastest) |
| **Drag and Drop** | Drag an image file onto the screen |
| **File Upload** | Click the "Choose File" button, then select an image |
| **Clipboard Button** | Use the "Paste from Clipboard" button for automatic detection |

### Result View
- 🔗 **URL** → Clickable link + "Open Link" button + copy to clipboard
- 📄 **Text** → Displayed text + copy to clipboard

---

## 🎨 Themes

You can switch between 3 themes using the toggle in the top-right corner. Your selected theme stays applied even after a refresh.

| Mode | Background | Accent Color |
|---|---|---|
| ☀️ **Light** | White | Blue `#1976d2` |
| 🌙 **Dark** | Deep navy | Soft blue `#60a5fa` |
| 🌃 **Night** | OLED black | Emerald green `#34d399` |

---

## 📁 Project Structure

```text
src/
├── app/
│   ├── layout.tsx            # Root layout (includes ThemeProvider)
│   ├── page.tsx              # Home -> /qr-scanner redirect
│   ├── globals.css           # Global CSS
│   └── qr-scanner/
│       └── page.tsx          # Main page
├── components/
│   ├── ThemeProvider.tsx     # MUI theme context + localStorage persistence
│   ├── ThemeToggle.tsx       # Light / Dark / Night switch button
│   ├── Navbar.tsx            # Top navigation bar
│   └── QRScanner.tsx         # Core QR extraction component
└── theme/
    └── index.ts              # 3 theme palettes and component overrides
```

---

## 🛠️ Tech Stack

| Role | Library |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack) |
| UI | Material UI v6 |
| QR Decoding | jsQR |
| Language | TypeScript |
| Styling | Emotion (built into MUI) |

---

## 📄 License

MIT

---

## Korean

> **카메라 없이, 이미지만으로 QR 코드를 즉시 추출**

스크린샷을 찍었거나, QR 코드가 담긴 이미지가 있다면 — 카메라나 스마트폰 없이도 바로 정보를 꺼낼 수 있습니다.  
붙여넣기(`Ctrl+V`) 한 번으로 QR 코드 안의 URL 또는 텍스트를 즉시 확인하세요.

---

## ✨ 왜 PasteQR인가?

기존 QR 스캐너는 카메라로 직접 찍어야 합니다. 하지만 우리는 대부분 **이미지로** QR을 마주칩니다.

- 카카오톡으로 받은 QR 이미지
- 웹사이트 스크린샷 속 QR 코드
- PDF, 문서 안에 삽입된 QR 코드
- 저장해둔 QR 이미지 파일

**PasteQR**은 이 모든 상황을 해결합니다. 이미지를 붙여넣거나 올리기만 하면 끝.

---

## 🚀 시작하기

```bash
# 1. 의존성 설치
npm install

# 2. 개발 서버 실행
npm run dev
```

브라우저에서 http://localhost:3000 으로 접속하세요.

```bash
# 프로덕션 빌드
npm run build && npm start
```

---

## 🛠️ 사용 방법

| 방법 | 단계 |
|---|---|
| **붙여넣기** | QR 이미지 복사 후 `Ctrl+V` (가장 빠름) |
| **드래그 앤 드롭** | 이미지 파일을 화면에 드래그 |
| **파일 업로드** | "파일 선택" 버튼 클릭 후 이미지 선택 |
| **클립보드 버튼** | "클립보드 붙여넣기" 버튼으로 자동 감지 |

### 결과 화면
- 🔗 **URL** → 클릭 가능한 링크 + "링크 열기" 버튼 + 클립보드 복사
- 📄 **텍스트** → 텍스트 표시 + 클립보드 복사

---

## 🎨 테마

우측 상단 토글로 3가지 테마를 전환할 수 있습니다. 선택한 테마는 새로고침 후에도 유지됩니다.

| 모드 | 배경 | 포인트 컬러 |
|---|---|---|
| ☀️ **Light** | 흰색 | 파란색 `#1976d2` |
| 🌙 **Dark** | 짙은 네이비 | 소프트 블루 `#60a5fa` |
| 🌃 **Night** | OLED 블랙 | 에메랄드 그린 `#34d399` |

---

## 📁 프로젝트 구조

```text
src/
├── app/
│   ├── layout.tsx            # 루트 레이아웃 (ThemeProvider 포함)
│   ├── page.tsx              # 홈 → /qr-scanner 리다이렉트
│   ├── globals.css           # 전역 CSS
│   └── qr-scanner/
│       └── page.tsx          # 메인 페이지
├── components/
│   ├── ThemeProvider.tsx     # MUI 테마 컨텍스트 + localStorage 저장
│   ├── ThemeToggle.tsx       # 라이트 / 다크 / 나이트 전환 버튼
│   ├── Navbar.tsx            # 상단 네비게이션 바
│   └── QRScanner.tsx         # 핵심 QR 추출 컴포넌트
└── theme/
    └── index.ts              # 3가지 테마 팔레트 및 컴포넌트 오버라이드
```

---

## 🛠️ 기술 스택

| 역할 | 라이브러리 |
|---|---|
| 프레임워크 | Next.js 15 (App Router, Turbopack) |
| UI | Material UI v6 |
| QR 디코딩 | jsQR |
| 언어 | TypeScript |
| 스타일링 | Emotion (MUI 내장) |

---

## 📄 라이선스

MIT
