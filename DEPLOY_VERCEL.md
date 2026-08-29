# Vercel 배포 가이드

## 권장 경로: GitHub → Vercel Preview → Production

이 프로젝트는 기존 Vercel 서비스가 있으므로 production에 바로 덮어쓰기보다 Preview에서 먼저 검수하는 방식을 권장합니다.

### 1. 코드 반영

```bash
git checkout -b feature/design-dna-diversity
# 수정본 파일 반영
git status
git diff
```

### 2. 로컬 검증

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run build
```

### 3. 환경 변수 확인

필수:

```text
OPENAI_API_KEY
SITE_PASSWORD
```

선택:

```text
OPENAI_TEXT_MODEL=gpt-5.6-terra
OPENAI_IMAGE_MODEL=gpt-image-2
OPENAI_IMAGE_EDIT_MODEL=gpt-image-2
```

실제 값은 소스코드나 Git에 넣지 않습니다.

### 4. Preview 배포

GitHub와 Vercel이 연결되어 있다면:

```bash
git add .
git commit -m "feat: diversify title generator with Design DNA"
git push -u origin feature/design-dna-diversity
```

Vercel에서 branch Preview가 생성되면 아래 체크리스트를 모두 확인합니다.

- [ ] 로그인
- [ ] 제목 시안 2안 생성
- [ ] 1안/2안 Design DNA 차이 확인
- [ ] `완전히 다른 스타일 2안`
- [ ] `색상만 다시 추천` 시 DNA 유지
- [ ] 시안 선택
- [ ] 제목만 투명 PNG
- [ ] 실제 아이콘 분리
- [ ] 추천 아이콘
- [ ] 실시간 recolor
- [ ] 썸네일 배경 2안
- [ ] ZIP 다운로드
- [ ] `design-meta.json` 확인
- [ ] 모바일 화면 기본 동작

### 5. Production 배포

Preview 검수 후 production branch에 병합합니다.

```bash
git checkout main
git pull --ff-only
git merge --no-ff feature/design-dna-diversity
git push origin main
```

Vercel 프로젝트에서 실제 production branch가 다른 이름이면 그 설정을 우선합니다.

## 대안: Vercel CLI

Git 연동을 쓰지 않는 경우:

```bash
npx vercel
```

Preview 확인 후:

```bash
npx vercel --prod
```

## 롤백

Production에서 문제가 발견되면 Vercel 대시보드에서 직전 정상 Production Deployment로 Promote/Rollback하거나, Git 기반이라면 문제 커밋을 revert한 뒤 다시 push합니다.

## 배포 후 특히 볼 지표

- `/api/generate-candidates` 실패율
- OpenAI text analysis 추가 호출에 따른 비용/응답시간
- `AI 디자인 분석 실패 → local fallback` 로그 빈도
- 이미지 생성 1안/2안의 체감 다양성
- `완전히 다른 스타일 2안` 재사용 빈도
- 투명 PNG validation 실패율

## 추천 운영 방식

첫 2~4주 동안 `design-meta.json`의 `designDNA.noveltyKey`를 모아 실제 선택 패턴을 확인하면 좋습니다. 많이 선택되는 스타일은 유지하되, 특정 조합으로 다시 수렴하면 최근 이력 범위 또는 스타일 가중치를 조정합니다.
