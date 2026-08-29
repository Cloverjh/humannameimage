# Design DNA 개선 변경사항

날짜: 2026-08-29

## 문제

기존 생성기는 1안/2안이 사실상 `따뜻하고 부드러운 관계 중심`과 `정돈되고 전문적인 실무 중심` 두 방향에 고정되고, 배치 역시 중앙 중심으로 수렴했습니다. 홍보 문구/핵심 주제/대상자는 디자인 결정에 충분히 사용되지 않았고, 최근 이력은 색상 위주로만 관리되어 결과가 반복적으로 느껴질 수 있었습니다.

## 변경

### 디자인 기획
- `DesignDNA` 도입
- 8개 스타일 계열
- 7개 구도
- 7개 타이포그래피 계열
- 8개 그래픽 언어
- 밀도/강조법/형태 언어 분리
- AI 디자인 디렉터 추가
- 1안/2안 최소 4개 디자인 축 차이 강제
- AI 분석 실패 시 로컬 fallback

### 프롬프트
- 중앙 정렬 고정 제거
- 교육명/홍보 문구/핵심 주제/대상자 전체 컨텍스트 연결
- visual metaphor 실제 생성 프롬프트 연결
- 스타일별 장식 밀도 차등
- generic rounded wellness style 회피 지시
- Design DNA별 composition/typography/graphic language를 명시

### 최근 디자인 이력
- 색상과 별도로 Design DNA signature 저장
- 실제 선택된 시안만 최근 이력에 기록
- `완전히 다른 스타일 2안`에서 현재 시안 + 최근 선택 이력 회피

### 아이콘
- 추상 그래픽 후보 추가
- 제목/홍보문구/주제/대상자/visual metaphor/Design DNA 기반 점수화
- 비 semantic 스타일에서는 하트/잎/말풍선 같은 literal 아이콘에 페널티

### UI
- 시안 카드에 Design DNA 정보 표시
- `완전히 다른 스타일 2안` 버튼 추가
- `색상만 다시 추천`은 DNA 잠금 후 팔레트만 변경

### 썸네일 배경
- 선택된 Design DNA의 style/composition/graphic language/shape/density/mood를 반영
- 무조건 중앙 대칭형 배경으로 수렴하지 않게 개선

### ZIP 메타데이터
`design-meta.json`에 다음 추가:
- designDNA
- contentSummary
- topicCategories
- visualMetaphor
- lineBreakPlan
- titlePlacement
