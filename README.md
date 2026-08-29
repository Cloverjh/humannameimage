# 교육 제목 이미지 생성기

휴먼임팩트협동조합 교육 홍보물에 사용할 수 있는 제목형 PNG 이미지를 생성하는 Next.js 웹앱입니다.

교육명과 홍보 문구를 입력하면 AI가 교육 분위기에 맞는 제목 디자인을 2안으로 제안하고, 사용자가 선택한 안을 기준으로 투명 PNG 세트를 만들어 줍니다.

## 주요 기능

- 꾸민 제목 투명 PNG 2안 병렬 생성
- 8개 Design DNA 계열 기반의 다양한 스타일 제안
- 사용자가 선택한 시안 기준으로 제목만 PNG, 아이콘만 PNG 파생 생성
- 제목 이미지와 어울리는 썸네일 배경 2안 생성
- 생성된 결과물의 색상만 실시간으로 변경
- 개별 PNG 다운로드 및 ZIP 다운로드
- 팀 전용 비밀번호 로그인
- Vercel 배포 지원

## 결과물

최종적으로 아래 파일을 받을 수 있습니다.

```text
01_꾸민제목_선택안.png
02_제목만_투명.png
03_아이콘만_투명.png
```

추가로 제목 이미지와 함께 사용할 수 있는 썸네일 배경 2안도 생성할 수 있습니다.

```text
thumbnail-backgrounds/01_썸네일배경_1안.png
thumbnail-backgrounds/02_썸네일배경_2안.png
```

## 생성 흐름

1. 교육명, 홍보 문구, 핵심 주제, 대상자를 입력합니다.
2. `제목 시안 2안 생성하기` 버튼을 누릅니다.
3. 꾸민 제목 투명 PNG 1안과 2안이 동시에 생성됩니다.
4. 원하는 시안을 선택합니다.
5. 선택한 꾸민 제목 이미지를 기준으로 제목만 PNG와 아이콘만 PNG가 동시에 생성됩니다.
6. 필요하면 색상 변경 패널에서 결과물의 팔레트를 조정합니다.
7. 개별 PNG 또는 ZIP 파일로 다운로드합니다.

## 디자인 일관성

앱은 선택된 꾸민 제목 PNG를 마스터 이미지로 사용합니다.

`제목만 PNG`와 `아이콘만 PNG`는 새로 독립 생성하지 않고, 선택된 꾸민 제목 이미지와 동일한 스타일, 색상, 줄바꿈, 장식 구성을 유지하도록 생성됩니다.

서버는 제목만 또는 아이콘만 생성 요청에 마스터 이미지가 없으면 요청을 거절합니다.

Design DNA는 스타일 계열, 구도, 타이포그래피, 그래픽 언어, 밀도, 강조 방식, 형태 언어를 분리해서 다룹니다.

지원 계열은 `editorial`, `bold-type`, `hand-drawn`, `geometric`, `sticker`, `minimal`, `diagram`, `experimental`입니다.

## 색상 변경

생성 후 색상만 바꾸고 싶을 때는 색상 변경 패널을 사용할 수 있습니다.

- 컬러 피커와 HEX 입력값이 실시간으로 미리보기에 반영됩니다.
- 미리보기는 브라우저 Canvas에서 처리되어 API 비용이 추가로 들지 않습니다.
- `적용하기`를 누르면 원본 해상도 기준으로 색상이 반영됩니다.
- 배경 투명도와 기존 외곽선은 최대한 유지합니다.
- ZIP의 `design-meta.json`에 색상 변경 정보가 함께 저장됩니다.

## 품질 원칙

- 이미지 생성과 편집 품질은 항상 `high`를 사용합니다.
- 속도를 위해 `medium` 또는 `low` 품질로 낮추지 않습니다.
- 1안과 2안은 `Promise.all` 기반으로 병렬 생성합니다.
- 선택 전에는 제목만 PNG와 아이콘만 PNG를 미리 만들지 않습니다.
- 선택 후 파생 이미지 2종도 병렬 생성합니다.
- 이미지 생성 후 서버에서 정확한 출력 크기로 리사이즈합니다.

## 출력 크기

제목 PNG는 아래 크기를 지원합니다.

```text
1500 x 730
1500 x 416
1500 x 1500
```

썸네일 배경은 아래 크기로 생성됩니다.

```text
1920 x 1440
```

PNG는 300dpi 메타데이터를 포함하도록 서버에서 후처리합니다.

## 기술 스택

- Next.js
- TypeScript
- React
- Tailwind CSS
- OpenAI Image API
- Sharp
- html-to-image

## 로컬 실행

의존성을 설치합니다.

```bash
npm install
```

개발 서버를 실행합니다.

```bash
npm run dev
```

브라우저에서 접속합니다.

```text
http://localhost:3000
```

## 환경변수

`.env.local` 파일을 프로젝트 루트에 만들고 아래 값을 넣습니다.

```bash
OPENAI_API_KEY=sk-your-api-key-here
SITE_PASSWORD=your-site-password
```

선택적으로 모델을 지정할 수 있습니다.

```bash
OPENAI_TEXT_MODEL=gpt-4.1-mini
OPENAI_IMAGE_MODEL=gpt-image-2
```

주의: 실제 API 키와 실제 비밀번호는 GitHub에 커밋하면 안 됩니다.

## 로그인 보안

- 실제 비밀번호는 서버 환경변수 `SITE_PASSWORD`와 비교합니다.
- 클라이언트 코드에는 비밀번호를 넣지 않습니다.
- 화면에서 비밀번호 길이나 형식을 알려주지 않습니다.
- 인증 쿠키 이름은 `hi_site_auth`입니다.
- 인증되지 않은 API 요청은 `401 Unauthorized`를 반환합니다.

## 주요 API

- `POST /api/auth/login`
  - 입력한 비밀번호와 `SITE_PASSWORD`를 서버에서 비교합니다.

- `POST /api/auth/logout`
  - 인증 쿠키를 제거합니다.

- `POST /api/generate-candidates`
  - 꾸민 제목 투명 PNG 1안과 2안 생성을 위한 프롬프트 세트를 만듭니다.

- `POST /api/generate-image`
  - 꾸민 제목 이미지를 생성하거나, 선택된 마스터 이미지에서 제목만/아이콘만 이미지를 파생합니다.

- `POST /api/extract-icons`
  - 선택된 이미지에서 실제 장식 아이콘을 분리합니다.

- `POST /api/generate-recommended-icon`
  - 선택된 제목 디자인과 어울리는 추천 아이콘을 생성합니다.

- `POST /api/generate-thumbnail-background`
  - 선택된 제목 디자인과 어울리는 썸네일 배경을 생성합니다.

- `POST /api/make-transparent`
  - 투명 PNG 후처리를 수행합니다.

- `POST /api/recolor-image`
  - 서버 기반 색상 변경 API입니다. 현재 UI의 실시간 미리보기는 클라이언트 Canvas 기반으로 동작합니다.

## 프로젝트 구조

```text
src/
  app/
    api/
      auth/
      extract-icons/
      generate-candidates/
      generate-image/
      generate-recommended-icon/
      generate-thumbnail-background/
      make-transparent/
      recolor-image/
    login/
    layout.tsx
    page.tsx
  components/
    GenerativeImageStudio.tsx
    LoginForm.tsx
    TitleGenerator.tsx
  lib/
    auth.ts
    clientRecolor.ts
    generativeTypes.ts
    openaiImageApi.ts
    paletteEngine.ts
    promptBuilder.ts
    serverImageProcessing.ts
    zipDownload.ts
  styles/
    globals.css
```

## 품질 확인

타입 검사를 실행합니다.

```bash
npm run typecheck
```

프로덕션 빌드를 확인합니다.

```bash
npm run build
```

## Vercel 배포

Vercel 프로젝트의 Environment Variables에 아래 값을 등록합니다.

```text
OPENAI_API_KEY
SITE_PASSWORD
```

GitHub 저장소와 Vercel 프로젝트가 연결되어 있다면 `main` 브랜치에 푸시하면 자동 배포됩니다.

수동 배포가 필요하면 Vercel CLI에서 실행합니다.

```bash
vercel --prod
```
