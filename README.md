# PasteQR (QR 코드 판독기 – Next.js + MUI)

**Next.js (App Router)** 와 **Material UI v6** 로 제작한 **반응형 QR 코드 판독기**입니다.  
**클립보드 붙여넣기(Ctrl+V)**, **드래그 & 드롭**, **파일 선택** 업로드를 지원하며, **jsQR** 를 사용해 **브라우저에서만** QR 코드를 디코딩하고, 깔끔한 카드 UI에 결과를 표시합니다. **라이트 / 다크 / 나이트** 테마를 지원합니다.

---

## ✨ 기능

- **다양한 이미지 입력 방식**
  - **클립보드 붙여넣기**: `Ctrl+V` 또는 "클립보드 붙여넣기" 버튼으로 스크린샷을 바로 인식.
  - **드래그 & 드롭**: 이미지를 드롭존에 끌어다 놓으면 즉시 스캔.
  - **파일 선택**: "파일 선택" 버튼으로 시스템 파일 탐색기를 통해 업로드.

- **100% 클라이언트 사이드 디코딩**
  - 파일이 외부 서버로 전송되지 않음: 모든 QR 디코딩은 **jsQR** 라이브러리로 브라우저에서 실행.
  - 민감한 데이터가 포함된 QR 코드도 안전하게 처리 가능.
  - 카메라 불필요 — 이미지만으로 QR 코드 인식.

- **고급 멀티 스캔 엔진**
  - 단일 QR 뿐만 아니라 **이미지 내 다중 QR 코드 자동 감지**.
  - 3단계 스캔 전략:
    1. **전체 이미지 스캔**: 다중 스케일(0.5x ~ 3x) × 다중 필터(일반 / 그레이스케일 / 고대비 / 반전) 조합.
    2. **여백(Quiet Zone) 추가**: 여백 없는 QR 대응을 위해 20px ~ 60px 패딩 자동 부여.
    3. **슬라이딩 윈도우 타일 스캔**: 2×2 ~ 8×8 격자로 분할, 오버랩 적용 후 업스케일하여 작은 QR도 정밀 인식.
  - 고정 크기 정규화(200px ~ 800px) 전략으로 극소·극대 QR 모두 대응.
  - 이전에 발견된 QR 영역을 마스킹하여 반복 탐색 시 다음 QR을 탐지.

- **URL 자동 감지 및 링크 생성**
  - 디코딩 결과가 URL인 경우 자동으로 감지하여 **"열기" 버튼** 제공 (새 탭에서 열림).
  - 일반 텍스트는 모노스페이스 폰트로 표시.
  - 각 결과에 **URL / 텍스트** 타입 칩이 표시됨.

- **클릭으로 클립보드 복사**
  - 각 QR 결과 옆 **"복사"** 버튼 클릭 시 해당 텍스트를 클립보드에 복사.
  - 다중 결과 시 **"전체 복사"** 버튼으로 모든 결과를 한 번에 복사 (`[1] 텍스트\n[2] 텍스트` 형식).
  - `navigator.clipboard` 미지원 브라우저를 위한 `document.execCommand("copy")` 폴백 포함.
  - 복사 완료 시 버튼이 **2초간 "복사됨!" 상태**로 변경.

- **상태 표시 및 로딩 UI**
  - 스캔 중 **원형 프로그레스 스피너** + QR 아이콘이 포함된 로딩 화면.
  - 단계별 로딩 메시지: "QR 코드 분석 중…" → "이미지를 타일로 분할하여 정밀 스캔 중…".
  - 인식 실패 시 **경고 컴포넌트**로 오류 메시지 표시 및 재시도 버튼 제공.

- **이미지 미리보기**
  - 업로드된 이미지를 **최대 320px 높이로 미리보기** 표시.
  - "초기화" 버튼으로 이미지 및 결과를 클리어하고 드롭존으로 복귀.
  - `URL.revokeObjectURL`을 통한 메모리 관리.

- **테마 (라이트 / 다크 / 나이트)**
  - 세 가지 MUI 테마 프리셋:
    - **라이트** – 밝은 회색 배경, 클래식 블루 프라이머리.
    - **다크 (기본값)** – 슬레이트 네이비 배경, 스카이 블루 + 퍼플 액센트.
    - **나이트** – 딥 다크 배경, 에메랄드 그린 + 스카이 블루 액센트, 그라디언트 버튼.
  - 앱바 우측 **토글 버튼 그룹** 으로 테마 전환 (☀ / 🌙 / 🌃 아이콘).
  - 선택된 테마는 `localStorage`의 `theme-mode` 키에 영구 저장.

- **브랜딩 (앱바 + 아이콘)**
  - 앱바 좌측에 **QR 스캐너 아이콘** + 그라디언트 텍스트 "PasteQR" 로고.
  - 페이지 중앙에 **QR 코드 아이콘** 포함 대형 히어로 섹션.
  - 하단에 사용 팁 칩 나열.

- **반응형 레이아웃**
  - MUI `Container` (최대 너비: `md`) 기반 중앙 정렬.
  - 모바일 / 태블릿 / 데스크톱 모두에서 원활하게 작동.
  - `overflow-wrap: anywhere`로 긴 QR 텍스트도 레이아웃 깨짐 없이 표시.

---

## 🧰 기술 스택

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)
![App Router](https://img.shields.io/badge/App%20Router-활성화-blue?style=flat-square)
![MUI](https://img.shields.io/badge/MUI-6.x-007FFF?logo=mui&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![jsQR](https://img.shields.io/badge/jsQR-1.4-green)

- **Next.js 15 (App Router)** + **TypeScript** (Turbopack 개발 서버)
- **React 19**
- **Material UI v6** (`@mui/material`, `@mui/icons-material`, `@emotion/*`)
- **jsQR** — 클라이언트 사이드 QR 코드 디코딩
- **notistack** (설치됨, 향후 확장용)
- 백엔드 및 외부 API 없음 – **100% 클라이언트 사이드**

---

## 🌐 라이브 데모

- 프로덕션 Vercel 배포 : https://paste-qr.vercel.app/

---

## 🔑 환경 설정

외부 API 또는 시크릿 키가 필요하지 않습니다.

자체 확장을 위한 환경 변수가 필요한 경우에만 `.env.local`을 생성하세요.  
기본 PasteQR 앱은 별도 설정 없이 실행됩니다.

---

## 📁 프로젝트 구조

```text
src/
  app/
    layout.tsx               # 루트 레이아웃, 테마 프로바이더 래핑, 네비게이션 바, 메타데이터
    page.tsx                 # 루트 리다이렉트 → /qr-scanner
    globals.css              # 전역 CSS 초기화 / 스크롤바 스타일
    qr-scanner/
      page.tsx               # QR 스캐너 페이지 (컨테이너 + QRScanner 컴포넌트)
  components/
    ThemeProvider.tsx         # MUI 테마 프로바이더 (라이트 / 다크 / 나이트 + localStorage)
    ThemeToggle.tsx           # 테마 전환 토글 버튼 그룹
    Navbar.tsx               # 상단 앱바 (PasteQR 로고 + 테마 토글)
    QRScanner.tsx            # 핵심 컴포넌트: 드롭존, 스캔 엔진, 결과 UI
  theme/
    index.ts                 # 테마 정의 (라이트 / 다크 / 나이트 팔레트)
README.md                    # 이 문서
```

---

## 🧩 컴포넌트 상세

### `ThemeProvider`

- `createContext` 기반 테마 상태 관리.
- 세 가지 테마 옵션 (`light`, `dark`, `night`):
  - `light` / `dark` 는 MUI `palette.mode`에 매핑, `night`는 커스텀 다크 팔레트.
- `localStorage`(`theme-mode`)에 마지막 선택 테마를 영구 저장.
- `MuiThemeProvider` + `CssBaseline`으로 전체 앱을 래핑.

### `Navbar`

- 상단 **앱바** (고정, 그림자 없음, 반투명 + 배경 블러).
- 좌측: QR 스캐너 아이콘 + 그라디언트 텍스트 "PasteQR" 로고 (Next.js `Link` 컴포넌트).
- 우측: `ThemeToggle` 컴포넌트.

### `ThemeToggle`

- MUI `ToggleButtonGroup` 으로 라이트 / 다크 / 나이트 전환.
- 각 버튼에 해(라이트) / 달(다크) / 밤하늘(나이트) 아이콘 배치.
- 선택된 버튼에 프라이머리 컬러 하이라이트.

### `QRScanner`

핵심 QR 디코딩 및 UI 로직:

- 상태 관리:

  ```ts
  type QRResult = {
    text: string;     // 디코딩된 텍스트
    isUrl: boolean;   // URL 여부 자동 감지
    index: number;    // 발견 순서
  };
  ```

- 이미지 입력 처리:
  - `window.addEventListener("paste", ...)` — 전역 붙여넣기 이벤트 감지.
  - `navigator.clipboard.read()` — 클립보드 API를 통한 이미지 읽기 (버튼 클릭 시).
  - 드래그 진입 / 이탈 / 오버 / 드롭 이벤트 (시각적 하이라이팅 포함).
  - 숨겨진 `<input type="file" accept="image/*">` 을 통한 파일 선택.

- QR 디코딩 엔진 (`tryDecodeAllQRCodes`):
  - **1단계 — 전체 이미지 스캔** (`scanFullImage`):
    - 12가지 스케일 × 필터 조합 시도.
    - 여백(Quiet Zone) 추가 (20 / 40 / 60px × 4가지 필터).
    - 고정 크기 정규화 (200 ~ 800px × 4가지 필터).
    - 발견된 QR 영역을 마스킹하여 최대 10개까지 반복 탐색.
  - **2단계 — 타일 분할 스캔** (`scanTiles`):
    - 5가지 격자 구성 (2×2 ~ 8×8).
    - 오버랩 비율 25% ~ 45%.
    - 타일별 업스케일 후 4종 필터 적용.
    - 슬라이딩 윈도우 방식으로 가장자리 누락 방지.
  - `yieldToUI()` 로 각 단계 사이 UI 블로킹 방지.

- 렌더링:
  - **드롭존 카드**: 업로드 아이콘, 안내 텍스트, "파일 선택" / "클립보드 붙여넣기" 버튼, `Ctrl+V` 힌트.
  - **로딩 화면**: 원형 프로그레스 스피너 + 단계별 메시지.
  - **이미지 미리보기 카드**: 업로드된 이미지 표시 + 초기화 버튼.
  - **결과 카드**: QR 번호, URL/텍스트 타입 칩, 디코딩 텍스트, 복사/열기 버튼.
  - **하단 액션 바**: 전체 복사 버튼 (다중 결과 시) + 초기화 버튼.
  - **사용 팁**: 하단에 칩 형태로 주요 기능 나열.

- 클립보드 동작:
  - `navigator.clipboard.writeText(text)` 시도.
  - 실패 시 숨겨진 `<textarea>` + `document.execCommand("copy")` 폴백.
  - 복사 완료 시 2초간 버튼 상태 변경 (체크 아이콘 + "복사됨!").

---

## 🧠 UX 참고 사항

- 카메라 없이 이미지만으로 QR 코드를 인식하는 것이 핵심 사용 시나리오.
- **Ctrl+V 붙여넣기**를 최우선 입력 방식으로 설계하여 스크린샷 → 즉시 인식 워크플로우 최적화.
- 타일 분할 스캔은 시간이 소요될 수 있어 로딩 메시지를 단계별로 업데이트.
- 드롭존은 클릭 및 드래그 하이라이팅을 모두 지원하여 직관적인 파일 업로드 경험 제공.
- 모든 `Blob URL`은 컴포넌트 언마운트 또는 초기화 시 `revokeObjectURL`로 해제하여 메모리 누수 방지.
- 앱은 어떠한 파일 내용도 업로드하거나 로깅하지 않음 – 모든 데이터는 메모리에서만 처리.

---

## 🧩 변경 이력 (현재 빌드)

1. **PasteQR 초기 구현**
   - Next.js App Router (Turbopack) 기반 TypeScript 프로젝트 설정.
   - MUI 통합 및 전역 테마 구조 구성.
2. **이미지 입력 시스템**
   - 클립보드 붙여넣기 (`Ctrl+V` + Clipboard API), 드래그 & 드롭, 파일 선택 지원.
3. **jsQR 기반 QR 디코딩 엔진**
   - 다중 스케일 × 필터 전체 스캔.
   - 여백(Quiet Zone) 추가 전략.
   - 고정 크기 정규화 전략.
   - 슬라이딩 윈도우 타일 분할 스캔 (2×2 ~ 8×8).
   - 마스킹을 통한 다중 QR 반복 탐지.
4. **결과 UI**
   - QR 결과 카드 (URL/텍스트 타입 표시, 복사/열기 버튼).
   - 다중 결과 시 전체 복사 기능.
5. **테마 시스템**
   - 라이트 / 다크 (기본값) / 나이트 모드, `localStorage` 영구 저장.
6. **브랜딩**
   - 그라디언트 로고, QR 아이콘, 사용 팁 칩.
7. **이미지 미리보기 + 로딩 UI**
   - 업로드된 이미지 미리보기 카드.
   - 단계별 로딩 메시지 + 원형 프로그레스 스피너.

---

## 🔗 주요 명령어

```bash
# 의존성 설치
npm install

# Turbopack 개발 서버 실행 (http://localhost:3000)
npm run dev

# 타입 검사 및 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm run start

# 린터 실행
npm run lint
```

---

## 📜 라이선스

개인 / 내부 프로젝트용 데모입니다.  
필요 시 조직의 라이선스 조항으로 교체하세요.
