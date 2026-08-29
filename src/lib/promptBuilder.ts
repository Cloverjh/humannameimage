import { candidateLabelMap, candidateOrder, parseImageSize } from "@/lib/generativeOptions";
import { chooseCandidatePalettes, formatPaletteForPrompt, type PaletteChoice } from "@/lib/paletteEngine";
import type { DesignDirectorResult, DirectedCandidate } from "@/lib/designDirector";
import type {
  CandidateId,
  DesignComposition,
  DesignSpec,
  DesignDNA,
  DesignDensity,
  DesignGraphicLanguage,
  DesignTypography,
  EducationImageForm,
  GeneratedCandidateSet,
  GeneratedPrompt,
  GeneratedPromptSet,
  ImageSize,
  OutputType,
  PaletteColor,
  PromptAnalysis
} from "@/lib/generativeTypes";

type Classification = "counseling" | "community" | "practice" | "promotion" | "reflective" | "care";

type CandidateVariant = {
  id: CandidateId;
  label: string;
  direction: string;
  seedOffset: number;
  warmth: "soft" | "structured";
  directed: DirectedCandidate;
};

type LocalProfile = {
  id: string;
  dna: Omit<DesignDNA, "noveltyKey">;
  direction: string;
  visualMetaphor: string;
  decorations: string[];
};

const localProfiles: LocalProfile[] = [
  {
    id: "editorial",
    dna: {
      styleFamily: "editorial",
      composition: "left-asymmetric",
      typography: "editorial",
      graphicLanguage: "abstract-shapes",
      density: "minimal",
      emphasis: "size-hierarchy",
      shapeLanguage: "organic",
      mood: "차분하지만 선명한 에디토리얼",
      label: "에디토리얼 포커스",
      rationale: "큰 제목 위계와 여백으로 교육의 핵심 메시지를 빠르게 읽히게 합니다."
    },
    direction: "왼쪽에 강한 제목 위계를 두고 넓은 여백과 추상 형태로 정돈하는 에디토리얼 방향",
    visualMetaphor: "겹치는 여백과 한 방향으로 흐르는 얇은 리듬",
    decorations: ["offset contour line", "small cropped circle", "single editorial dot"]
  },
  {
    id: "bold-type",
    dna: {
      styleFamily: "bold-type",
      composition: "top-heavy",
      typography: "massive",
      graphicLanguage: "geometric-symbols",
      density: "balanced",
      emphasis: "color-block",
      shapeLanguage: "angular",
      mood: "강하고 직관적인 타이포 포스터",
      label: "볼드 타이포",
      rationale: "핵심 단어의 크기 대비를 크게 만들어 특강·실무 교육의 전달력을 높입니다."
    },
    direction: "상단과 좌측에 큰 타이포를 밀도 있게 두고 핵심 단어를 컬러 블록처럼 강조하는 방향",
    visualMetaphor: "큰 메시지 블록 사이를 통과하는 짧은 방향 표시",
    decorations: ["short directional arrow", "angular corner mark", "small solid dot"]
  },
  {
    id: "hand-drawn",
    dna: {
      styleFamily: "hand-drawn",
      composition: "right-asymmetric",
      typography: "marker",
      graphicLanguage: "marker-doodles",
      density: "rich",
      emphasis: "underline",
      shapeLanguage: "organic",
      mood: "사람 냄새 나는 손그림 워크숍",
      label: "핸드 드로운",
      rationale: "현장성과 관계성을 손으로 그린 듯한 리듬으로 표현해 친근한 학습 분위기를 만듭니다."
    },
    direction: "오른쪽으로 치우친 제목과 자유로운 마커 선, 작은 낙서형 장식을 사용하는 따뜻한 방향",
    visualMetaphor: "한 번에 이어 그린 선과 서로 만나는 작은 흔적",
    decorations: ["loose marker loop", "hand-drawn underline", "small doodle spark"]
  },
  {
    id: "geometric",
    dna: {
      styleFamily: "geometric",
      composition: "modular-grid",
      typography: "geometric",
      graphicLanguage: "geometric-symbols",
      density: "balanced",
      emphasis: "outline",
      shapeLanguage: "geometric",
      mood: "구조적이고 현대적인 시스템 그래픽",
      label: "지오메트릭 시스템",
      rationale: "기획·평가·AI·실무 교육처럼 구조와 실행이 중요한 내용을 모듈형 그래픽으로 전달합니다."
    },
    direction: "모듈 그리드 안에서 제목 크기를 달리하고 기하학적 기호를 제한적으로 배치하는 방향",
    visualMetaphor: "서로 연결되는 모듈과 한 칸씩 확장되는 구조",
    decorations: ["small node grid", "open square module", "thin connector line"]
  },
  {
    id: "sticker",
    dna: {
      styleFamily: "sticker",
      composition: "center-stacked",
      typography: "rounded",
      graphicLanguage: "collage-cutout",
      density: "rich",
      emphasis: "highlight-shape",
      shapeLanguage: "rounded",
      mood: "유쾌하고 친근한 스티커 그래픽",
      label: "스티커 그래픽",
      rationale: "신입·워크숍·참여형 교육에서 제목 주변의 작은 그래픽 조각으로 활기를 줍니다."
    },
    direction: "중앙 스택 제목을 두되 다양한 크기의 작은 컷아웃 그래픽을 주변에 리듬감 있게 두는 방향",
    visualMetaphor: "서로 다른 조각이 모여 하나의 메시지를 만드는 콜라주",
    decorations: ["small cutout blob", "rounded sticker tab", "tiny abstract badge shape", "short curved dash"]
  },
  {
    id: "minimal",
    dna: {
      styleFamily: "minimal",
      composition: "split",
      typography: "condensed",
      graphicLanguage: "none",
      density: "minimal",
      emphasis: "underline",
      shapeLanguage: "angular",
      mood: "절제되고 고급스러운 미니멀",
      label: "미니멀 스플릿",
      rationale: "정책·연구·리더십 교육에 필요한 신뢰감을 여백과 절제된 타이포로 만듭니다."
    },
    direction: "제목 블록을 두 영역으로 나누고 장식을 거의 쓰지 않으며 얇은 선 하나로 강조하는 방향",
    visualMetaphor: "두 영역을 가르는 한 줄과 의도적으로 비워 둔 공간",
    decorations: ["single thin divider", "tiny registration dot"]
  },
  {
    id: "diagram",
    dna: {
      styleFamily: "diagram",
      composition: "split",
      typography: "condensed",
      graphicLanguage: "diagrammatic",
      density: "balanced",
      emphasis: "size-hierarchy",
      shapeLanguage: "geometric",
      mood: "설명력이 높은 다이어그램형 디자인",
      label: "다이어그램 플로우",
      rationale: "성과평가·기획·프로세스 교육의 흐름과 관계를 제목 주변의 작은 구조 기호로 보여줍니다."
    },
    direction: "제목을 한쪽 축에 두고 반대편에 매우 작은 노드·흐름 기호를 배치하는 설명형 방향",
    visualMetaphor: "출발점에서 여러 단계로 이어지는 흐름과 연결 노드",
    decorations: ["two connected nodes", "thin flow arrow", "small step marker"]
  },
  {
    id: "experimental",
    dna: {
      styleFamily: "experimental",
      composition: "diagonal-flow",
      typography: "outline",
      graphicLanguage: "abstract-shapes",
      density: "balanced",
      emphasis: "rotation",
      shapeLanguage: "angular",
      mood: "트렌디하고 예상 밖의 실험적 타이포",
      label: "익스페리멘털",
      rationale: "새로운 주제나 이슈형 교육에서 기존 휴먼임팩트 결과와 확실히 다른 첫인상을 만듭니다."
    },
    direction: "대각선 흐름과 일부 회전된 강조 요소, 비정형 추상 기호를 사용하되 제목 가독성은 유지하는 방향",
    visualMetaphor: "고정된 틀을 벗어나 한 방향으로 튀어나가는 형태",
    decorations: ["offset slash mark", "cropped abstract wedge", "small orbit dot"]
  }
];

const categoryRules: Array<{ id: Classification; keywords: string[] }> = [
  { id: "community", keywords: ["주민", "조직화", "마을", "공동체", "고립", "외로움", "관계망", "상호돌봄", "타임뱅크", "연결", "지역복지"] },
  { id: "counseling", keywords: ["상담", "사례관리", "심리", "경청", "질문", "신뢰", "대화", "면담", "감정", "소진", "해결중심", "슈퍼비전"] },
  { id: "practice", keywords: ["AI", "인공지능", "스마트", "도구", "자동화", "업무", "실무", "현장", "성과", "기획", "평가", "엑셀", "스프레드시트"] },
  { id: "promotion", keywords: ["홍보", "마케팅", "브랜드", "콘텐츠", "PR", "소식", "캠페인", "포스터", "카드뉴스"] },
  { id: "care", keywords: ["돌봄", "의료", "통합돌봄", "안전", "건강", "중독", "정신건강", "위기"] },
  { id: "reflective", keywords: ["인권", "존엄", "철학", "인문", "글쓰기", "리더십", "조직", "갈등", "소통", "성찰", "마음", "회복"] }
];

const sharedAvoid = [
  "misspelled Korean text",
  "extra readable words",
  "people",
  "person",
  "portrait",
  "character",
  "human illustration",
  "photo",
  "scene",
  "room",
  "wall",
  "paper background",
  "card background",
  "banner background",
  "solid rectangle background",
  "large illustration",
  "frame",
  "official logo",
  "heavy 3D",
  "3D bevel",
  "glossy highlights",
  "white inner letter fills",
  "painted counters inside letters",
  "drop shadow clutter",
  "aggressive comic logo",
  "distorted Korean letters",
  "tiny unreadable decorations",
  "checkerboard pattern",
  "transparency preview pattern",
  "white and gray squares",
  "gray checkerboard",
  "black-and-white checkerboard",
  "simulated transparency",
  "visible background texture"
];

export function buildCandidatePromptSets(form: EducationImageForm, director?: DesignDirectorResult): GeneratedCandidateSet {
  const normalizedForm = normalizePromptForm(form);
  const categoryAnalysis = analyzeEducation(normalizedForm);
  const variants = createCandidateVariants(normalizedForm, categoryAnalysis.primary, director);
  const paletteChoices = chooseCandidatePalettes(normalizedForm, categoryAnalysis.primary, variants);
  const candidates = Object.fromEntries(
    candidateOrder.map((candidateId) => {
      const variant = variants[candidateId];
      const promptSet = buildPromptSetForVariant(normalizedForm, variant, paletteChoices[candidateId], categoryAnalysis, director);
      return [candidateId, promptSet];
    })
  ) as Record<CandidateId, GeneratedPromptSet>;

  return {
    id: `candidate-set-${createStableHash(`${normalizedForm.title}-${normalizedForm.styleSeed}-${normalizedForm.size}`)}`,
    candidates,
    size: normalizedForm.size,
    quality: "high",
    usedFallback: !director
  };
}

export function buildPromptSet(form: EducationImageForm): GeneratedPromptSet {
  return buildCandidatePromptSets(form).candidates["option-1"];
}

export function buildPromptLocally(form: EducationImageForm): GeneratedPrompt {
  const set = buildPromptSet(form);
  return set.prompts[form.outputType];
}

export function composeImagePrompt(form: EducationImageForm, _analysis: PromptAnalysis, _palette: PaletteColor[]) {
  return buildPromptLocally(form).prompt;
}

export function isTransparentOutput(outputType: string): outputType is OutputType {
  return outputType === "decorated-title" || outputType === "title-only" || outputType === "icons-only";
}

function buildPromptSetForVariant(
  form: EducationImageForm,
  variant: CandidateVariant,
  paletteChoice: PaletteChoice | undefined,
  categoryAnalysis: ReturnType<typeof analyzeEducation>,
  director?: DesignDirectorResult
): GeneratedPromptSet {
  const designSpec = createDesignSpec(form, variant, paletteChoice, categoryAnalysis, director);
  const prompts: Record<OutputType, GeneratedPrompt> = {
    "decorated-title": buildPromptFromSpec(form, designSpec, "decorated-title"),
    "title-only": buildPromptFromSpec(form, designSpec, "title-only"),
    "icons-only": buildPromptFromSpec(form, designSpec, "icons-only")
  };

  return {
    id: designSpec.id,
    designSpec,
    prompts,
    size: form.size,
    quality: "high",
    usedFallback: !director
  };
}

function normalizePromptForm(form: EducationImageForm): EducationImageForm {
  return {
    ...form,
    title: form.title.trim(),
    promotionCopy: form.promotionCopy.trim(),
    topics: form.topics.map((item) => item.trim()).filter(Boolean),
    audiences: form.audiences.map((item) => item.trim()).filter(Boolean),
    outputType: form.outputType || "decorated-title",
    textMode: form.textMode || "with-text",
    quality: "high",
    size: form.size,
    styleSeed: form.styleSeed || Date.now(),
    recentColorFamilies: (form.recentColorFamilies ?? []).filter(Boolean).slice(0, 8),
    recentDesignSignatures: (form.recentDesignSignatures ?? []).filter(Boolean).slice(0, 12),
    designDNAOverrides: form.designDNAOverrides,
    manualPalette: form.manualPalette
  };
}

function createCandidateVariants(
  form: EducationImageForm,
  category: Classification,
  director?: DesignDirectorResult
): Record<CandidateId, CandidateVariant> {
  const local = selectLocalProfiles(form);

  return Object.fromEntries(
    candidateOrder.map((candidateId, index) => {
      const override = form.designDNAOverrides?.[candidateId];
      const directed = override
        ? createDirectedCandidateFromDNA(override, form, category)
        : director?.candidates[candidateId] ?? local[candidateId];
      const warmth = getWarmthForDNA(directed.designDNA);

      return [
        candidateId,
        {
          id: candidateId,
          label: candidateLabelMap[candidateId],
          direction: directed.direction,
          seedOffset: index === 0 ? 11 : 47,
          warmth,
          directed
        }
      ];
    })
  ) as Record<CandidateId, CandidateVariant>;
}

function createDesignSpec(
  form: EducationImageForm,
  variant: CandidateVariant,
  paletteChoice: PaletteChoice | undefined,
  categoryAnalysis: ReturnType<typeof analyzeEducation>,
  director?: DesignDirectorResult
): DesignSpec {
  const seed = Math.abs(form.styleSeed + variant.seedOffset);
  const palette = paletteChoice?.palette ?? [];
  const designDNA = normalizeDesignDNA(variant.directed.designDNA);
  const keywords = mergeKeywords(variant.directed.keywords, getKeywords(form, categoryAnalysis.primary)).slice(0, 6);
  const coreEmotions = mergeKeywords(variant.directed.coreEmotions, getCoreEmotions(categoryAnalysis.primary)).slice(0, 3);
  const decorations = normalizeDecorations(variant.directed.decorations, designDNA, seed);
  const contentSummary = director?.contentSummary || createContentSummary(form);
  const audienceIntent = director?.audienceIntent || createAudienceIntent(form);
  const topicCategories = director?.topicCategories?.length ? director.topicCategories : categoryAnalysis.categories;

  return {
    id: `design-${createStableHash(`${form.title}|${form.size}|${seed}|${variant.id}|${designDNA.noveltyKey}`)}`,
    candidateId: variant.id,
    candidateLabel: variant.label,
    variantDirection: variant.direction,
    designDNA,
    coreEmotions,
    coreEmotion: coreEmotions.join(", "),
    keywords,
    topicCategory: categoryAnalysis.primary,
    topicCategories,
    contentSummary,
    audienceIntent,
    visualMetaphor: variant.directed.visualMetaphor || getVisualMetaphor(categoryAnalysis.primary),
    palette,
    paletteFamily: paletteChoice?.familyId,
    paletteLabel: paletteChoice?.label ?? paletteChoice?.familyName,
    paletteScore: paletteChoice?.score,
    paletteDistanceFromOption1: paletteChoice?.distanceFromOption1,
    typographyStyle: getTypographyPrompt(designDNA.typography),
    lineBreakPlan: getLineBreakPlan(form.title, form.size, designDNA),
    titlePlacement: getCompositionPrompt(designDNA.composition, form.size),
    decorations,
    emphasisWords: pickEmphasisWords(form.title, keywords),
    avoid: sharedAvoid,
    size: form.size
  };
}

function buildPromptFromSpec(form: EducationImageForm, spec: DesignSpec, outputType: OutputType): GeneratedPrompt {
  const analysis: PromptAnalysis = {
    coreEmotions: spec.coreEmotions,
    coreEmotion: spec.coreEmotion,
    keywords: spec.keywords,
    visualMetaphor: spec.visualMetaphor,
    recommendedColors: spec.palette.map((color) => `${color.name} ${color.hex}`),
    avoid: spec.avoid,
    titlePlacement: spec.titlePlacement,
    typographyStyle: spec.typographyStyle,
    aspectRatio: spec.size,
    transparentBackground: true,
    designSpecId: spec.id
  };

  return {
    analysis,
    prompt: createImagePrompt(form, spec, outputType),
    negativePrompt: spec.avoid.join(", "),
    palette: spec.palette,
    outputType,
    textMode: outputType === "icons-only" ? "without-text" : "with-text",
    size: spec.size,
    quality: "high",
    designSpec: spec,
    usedFallback: false
  };
}

function createImagePrompt(form: EducationImageForm, spec: DesignSpec, outputType: OutputType) {
  const title = form.title.trim();
  const paletteText = formatPaletteForPrompt(spec.palette);
  const dna = spec.designDNA;
  const trueTransparencyRules = [
    "Use a true transparent alpha background.",
    "IMPORTANT:",
    "- Do NOT draw a checkerboard pattern.",
    "- Do NOT simulate transparency with white and gray squares.",
    "- Do NOT render any transparency preview pattern.",
    "- Do NOT draw a black-and-white checkerboard.",
    "- Do NOT draw a gray checkerboard.",
    "- Do NOT include a white background.",
    "- Do NOT include a gray background.",
    "- Do NOT include a paper texture.",
    "- Do NOT include a card, panel, frame, or solid rectangle.",
    "- The background must be actual alpha transparency.",
    "- Background pixels must be transparent, not painted.",
    "- Return a production-ready isolated PNG asset with real alpha transparency.",
    "- If the model cannot encode alpha, use a single flat pure magenta #FF00FF chroma-key background only.",
    "- Do NOT use magenta, pink-magenta, or #FF00FF in the title lettering, outline, shadow, icons, highlights, or decorations.",
    "- Empty holes/counters inside Korean glyphs must reveal alpha transparency or the same removable #FF00FF chroma-key background."
  ].join("\n");
  const semanticContext = [
    "SEMANTIC CONTEXT — use this to make design decisions, but DO NOT render any of this as extra text:",
    `Promotion copy: ${form.promotionCopy || "(none)"}`,
    `Core topics: ${form.topics.join(" | ") || "(none)"}`,
    `Target audiences: ${form.audiences.join(" | ") || "(none)"}`,
    `Content summary: ${spec.contentSummary || "(none)"}`,
    `Audience intent: ${spec.audienceIntent || "(none)"}`,
    `Topic mix: ${(spec.topicCategories ?? [spec.topicCategory]).join(", ")}`
  ].join("\n");
  const designBrief = [
    `Title: "${title}"`,
    semanticContext,
    `Core emotions: ${spec.coreEmotions.join(", ")}`,
    `Keywords: ${spec.keywords.join(", ")}`,
    `Visual metaphor: ${spec.visualMetaphor}`,
    "DESIGN DNA:",
    `- Style family: ${dna.styleFamily}`,
    `- Composition: ${dna.composition}`,
    `- Typography family: ${dna.typography}`,
    `- Graphic language: ${dna.graphicLanguage}`,
    `- Density: ${dna.density}`,
    `- Emphasis method: ${dna.emphasis}`,
    `- Shape language: ${dna.shapeLanguage}`,
    `- Mood: ${dna.mood}`,
    `- Rationale: ${dna.rationale}`,
    `Selected color family: ${spec.paletteLabel ?? spec.paletteFamily ?? "custom palette"}`,
    "Color system:",
    paletteText,
    `Small visual motifs: ${spec.decorations.join(", ")}`,
    `Emphasis words: ${spec.emphasisWords.join(", ")}`,
    `Title line breaks: ${spec.lineBreakPlan}`,
    `Typography execution: ${spec.typographyStyle}`,
    `Composition execution: ${spec.titlePlacement}`,
    `Design lock id: ${spec.id}`
  ].join("\n");

  const commonRules = [
    "Create an isolated reusable Korean education-promotion PNG asset.",
    trueTransparencyRules,
    "Follow the specified Design DNA and composition. Do NOT automatically center the title unless the composition explicitly says center-stacked.",
    "Do NOT fall back to a generic rounded wellness-brand title treatment. The visual structure must reflect the selected style family.",
    "Keep the Korean headline highly readable and make the title the dominant element.",
    "Use the specified color system as a primary design constraint.",
    "Do not replace this palette with generic teal, coral, sage green, beige, blue-gray, or rose wellness-brand colors unless those exact colors are explicitly selected in the color system.",
    "Preserve clear hue contrast between headline roles, emphasis, and small visual motifs.",
    "Use flatter clean display lettering, not glossy 3D lettering.",
    "Do not fill empty counters or inner holes of Korean letters with white or gray paint; those empty spaces must be transparent alpha.",
    "Avoid heavy black shadows, stacked outline noise, bevels, shine streaks, and glossy highlights.",
    getDecorationRule(dna.density, dna.graphicLanguage),
    "No people, no human characters, no scene, no photo, no card background, no frame, no banner rectangle.",
    `Avoid: ${spec.avoid.join(", ")}.`
  ].join("\n");

  if (outputType === "decorated-title") {
    return [
      "Generate a decorated Korean title candidate.",
      designBrief,
      commonRules,
      `Render the Korean title exactly: "${title}".`,
      `Candidate direction: ${spec.candidateLabel} / ${spec.variantDirection}.`,
      "Use only the exact education title as readable text. Context fields are design references only.",
      "Respect the planned line breaks and emphasis hierarchy, while keeping natural Hangul spacing.",
      "Decorations may cross near the title edges but must not become a scene or a background panel.",
      "No subtitle text, body text, labels, badges with words, or extra readable words.",
      "Inside empty spaces of Hangul glyphs such as ㅇ, ㅁ, ㅂ, ㅎ, and counters must be actual transparent alpha, not white fill.",
      "Quality must be high."
    ].join("\n");
  }

  if (outputType === "title-only") {
    return [
      "Edit the provided input image. Use it as the master decorated title image.",
      designBrief,
      commonRules,
      "Output a title-only transparent PNG.",
      "Create an isolated Korean headline PNG asset with true alpha transparency.",
      "Requirements:",
      "- ONLY the Korean headline text.",
      "- Preserve the same title style, colors, line breaks, outline, composition, and emphasis as the selected decorated title.",
      "- No icons or decorative motifs.",
      "- No people, scene, panel, card, frame, checkerboard, white background, or gray background.",
      "- All pixels outside the headline must have alpha = 0.",
      "- Empty holes/counters inside Korean title glyphs must also have alpha = 0.",
      `Keep only the Korean title lettering exactly as shown in the input image: "${title}".`,
      "Do not redraw a new independent design. Derive this layer from the provided input image.",
      "Quality must be high."
    ].join("\n");
  }

  return [
    "Edit the provided input image. Use it as the master decorated title image.",
    designBrief,
    commonRules,
    "Output an icons-only transparent PNG.",
    "Remove all Korean title lettering and all readable text.",
    "Preserve only the selected image's visual motifs and decorative marks, with the same colors, scale relationship, line weight, and placement logic.",
    "Do not invent a new icon set. Do not add unrelated motifs. Derive this layer from the provided input image.",
    "No text, checkerboard, simulated transparency, white background, or gray background.",
    "Quality must be high."
  ].join("\n");
}

function selectLocalProfiles(form: EducationImageForm): Record<CandidateId, DirectedCandidate> {
  const recent = new Set((form.recentDesignSignatures ?? []).slice(0, 12));
  const baseIndex = createNumericHash(`${form.title}|${form.promotionCopy}|${form.styleSeed}`) % localProfiles.length;
  const rotated = [...localProfiles.slice(baseIndex), ...localProfiles.slice(0, baseIndex)];
  const ranked = [...rotated].sort((first, second) => {
    const firstKey = buildNoveltyKey(first.dna);
    const secondKey = buildNoveltyKey(second.dna);
    const firstPenalty = recent.has(firstKey) ? 1 : 0;
    const secondPenalty = recent.has(secondKey) ? 1 : 0;
    return firstPenalty - secondPenalty;
  });
  const first = ranked[0] ?? localProfiles[0];
  const second = ranked
    .slice(1)
    .map((profile) => ({ profile, distance: designDistance(first.dna, profile.dna), recentPenalty: recent.has(buildNoveltyKey(profile.dna)) ? 1 : 0 }))
    .sort((a, b) => a.recentPenalty - b.recentPenalty || b.distance - a.distance)[0]?.profile ?? localProfiles[3];

  return {
    "option-1": localProfileToDirected(first, form),
    "option-2": localProfileToDirected(second, form)
  };
}

function localProfileToDirected(profile: LocalProfile, form: EducationImageForm): DirectedCandidate {
  const category = analyzeEducation(form).primary;
  const dna = normalizeDesignDNA({ ...profile.dna, noveltyKey: buildNoveltyKey(profile.dna) });
  return {
    designDNA: dna,
    direction: profile.direction,
    visualMetaphor: `${profile.visualMetaphor} · ${getVisualMetaphor(category)}`,
    coreEmotions: getCoreEmotions(category),
    keywords: getKeywords(form, category),
    decorations: profile.decorations
  };
}

function createDirectedCandidateFromDNA(dna: DesignDNA, form: EducationImageForm, category: Classification): DirectedCandidate {
  const normalized = normalizeDesignDNA(dna);
  const matchingProfile = localProfiles.find((profile) => profile.dna.styleFamily === normalized.styleFamily);
  return {
    designDNA: normalized,
    direction: `${normalized.label}: ${normalized.mood}`,
    visualMetaphor: matchingProfile?.visualMetaphor ?? getVisualMetaphor(category),
    coreEmotions: getCoreEmotions(category),
    keywords: getKeywords(form, category),
    decorations: matchingProfile?.decorations ?? getGraphicFallbackDecorations(normalized.graphicLanguage)
  };
}

function normalizeDesignDNA(dna: DesignDNA): DesignDNA {
  return {
    ...dna,
    noveltyKey: dna.noveltyKey || buildNoveltyKey(dna)
  };
}

function buildNoveltyKey(dna: Omit<DesignDNA, "noveltyKey"> | DesignDNA) {
  return [dna.styleFamily, dna.composition, dna.typography, dna.graphicLanguage, dna.density, dna.emphasis, dna.shapeLanguage].join("|");
}

function designDistance(first: Omit<DesignDNA, "noveltyKey">, second: Omit<DesignDNA, "noveltyKey">) {
  const axes: Array<keyof Omit<DesignDNA, "noveltyKey" | "label" | "rationale" | "mood">> = [
    "styleFamily",
    "composition",
    "typography",
    "graphicLanguage",
    "density",
    "emphasis",
    "shapeLanguage"
  ];
  return axes.reduce((score, axis) => score + (first[axis] === second[axis] ? 0 : 1), 0);
}

function getWarmthForDNA(dna: DesignDNA): "soft" | "structured" {
  return ["hand-drawn", "sticker"].includes(dna.styleFamily) || dna.shapeLanguage === "organic" || dna.shapeLanguage === "rounded"
    ? "soft"
    : "structured";
}

function analyzeEducation(form: EducationImageForm) {
  const source = `${form.title} ${form.promotionCopy} ${form.topics.join(" ")} ${form.audiences.join(" ")}`.toLowerCase();
  const scored = categoryRules
    .map((rule) => ({
      id: rule.id,
      score: rule.keywords.reduce((total, keyword) => total + (source.includes(keyword.toLowerCase()) ? 1 : 0), 0)
    }))
    .filter((entry) => entry.score > 0)
    .sort((first, second) => second.score - first.score);
  const primary = scored[0]?.id ?? "reflective";
  const categories = scored.length > 0 ? scored.slice(0, 3).map((entry) => entry.id) : [primary];
  return { primary, categories };
}

function getCoreEmotions(classification: Classification) {
  const values: Record<Classification, string[]> = {
    counseling: ["차분함", "전문성", "신뢰감"],
    community: ["연결감", "활력", "사람 중심"],
    practice: ["명확함", "실용성", "추진력"],
    promotion: ["전달력", "밝음", "친근함"],
    reflective: ["성찰", "깊이", "안정감"],
    care: ["안정감", "온기", "신뢰감"]
  };
  return values[classification];
}

function getVisualMetaphor(classification: Classification) {
  const values: Record<Classification, string> = {
    counseling: "서로 다른 두 리듬이 겹치며 안정되는 흐름",
    community: "흩어진 점이 관계망으로 연결되는 구조",
    practice: "단계가 이어지며 실행으로 전환되는 흐름",
    promotion: "하나의 메시지가 여러 방향으로 확산되는 파동",
    reflective: "겹친 층 사이에서 한 줄의 의미가 드러나는 구조",
    care: "서로 다른 요소를 감싸며 지지하는 열린 경계"
  };
  return values[classification];
}

function getKeywords(form: EducationImageForm, classification: Classification) {
  const titleWords = form.title
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 2)
    .slice(0, 4);
  const topicWords = form.topics
    .join(" ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 2)
    .slice(0, 4);
  const byClass: Record<Classification, string[]> = {
    counseling: ["상담", "신뢰", "질문", "관계", "전문성"],
    community: ["연결", "공동체", "회복", "관계망", "실천"],
    practice: ["실무", "도구", "자동화", "실행", "현장"],
    promotion: ["홍보", "콘텐츠", "전달력", "브랜드", "관계"],
    reflective: ["성찰", "존엄", "소통", "깊이", "성장"],
    care: ["돌봄", "안전", "관계", "회복", "현장"]
  };

  return Array.from(new Set([...titleWords, ...topicWords, ...byClass[classification]])).slice(0, 6);
}

function createContentSummary(form: EducationImageForm) {
  return [form.promotionCopy, ...form.topics.slice(0, 2)].filter(Boolean).join(" ").replace(/\s+/g, " ").trim().slice(0, 220) || form.title;
}

function createAudienceIntent(form: EducationImageForm) {
  return form.audiences.slice(0, 2).join(" / ").slice(0, 180) || "사회복지 현장 실무자가 빠르게 이해하고 관심을 느끼는 제목 이미지";
}

function mergeKeywords(first: string[], second: string[]) {
  return Array.from(new Set([...first.filter(Boolean), ...second.filter(Boolean)]));
}

function pickEmphasisWords(title: string, keywords: string[]) {
  const afterComma = title.includes(",") ? title.split(",").slice(1).join(",") : "";
  const commaWords = afterComma
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 2)
    .slice(0, 2);
  const titleWords = title
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 2);
  const keywordHits = keywords.filter((keyword) => titleWords.some((word) => word.includes(keyword) || keyword.includes(word)));
  return Array.from(new Set([...commaWords, ...keywordHits, ...titleWords.slice(-2)])).slice(0, 3);
}

function getLineBreakPlan(title: string, size: ImageSize, dna: DesignDNA) {
  if (title.includes("\n")) {
    return title
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .join(" / ");
  }

  let targetLines = size === "1500x1500" ? 3 : size === "1500x416" ? 2 : 2;
  if (["center-stacked", "modular-grid"].includes(dna.composition) && title.replace(/\s/g, "").length >= 18) {
    targetLines = Math.min(3, size === "1500x416" ? 2 : 3);
  }
  if (["bold-type", "experimental"].includes(dna.styleFamily) && size !== "1500x416") {
    targetLines = 3;
  }
  return splitTitleForPrompt(title, targetLines).join(" / ");
}

function splitTitleForPrompt(title: string, maxLines: number) {
  const cleanTitle = title.replace(/\s+/g, " ").trim();
  if (maxLines <= 1 || cleanTitle.length <= 12) return [cleanTitle];

  const commaIndex = cleanTitle.indexOf(",");
  if (commaIndex > 0 && maxLines === 2) {
    const before = cleanTitle.slice(0, commaIndex + 1).trim();
    const after = cleanTitle.slice(commaIndex + 1).trim();
    if (before.length >= cleanTitle.length * 0.28 && after) return [before, after];
  }

  const words = cleanTitle.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let remainingWords = [...words];

  for (let lineIndex = 0; lineIndex < maxLines - 1 && remainingWords.length > 1; lineIndex += 1) {
    const remainingText = remainingWords.join("");
    const targetLength = Math.ceil(remainingText.length / (maxLines - lineIndex));
    const current: string[] = [];
    while (remainingWords.length > 1) {
      const nextWord = remainingWords[0];
      const nextLength = [...current, nextWord].join("").length;
      if (current.length > 0 && nextLength > targetLength + 2) break;
      current.push(remainingWords.shift() as string);
    }
    lines.push(current.join(" "));
  }
  if (remainingWords.length > 0) lines.push(remainingWords.join(" "));
  return lines.filter(Boolean);
}

function getTypographyPrompt(typography: DesignTypography) {
  const prompts: Record<DesignTypography, string> = {
    editorial: "editorial Korean display typography with sophisticated size contrast, crisp Hangul, restrained details, magazine-cover rhythm",
    condensed: "condensed Korean headline lettering with narrow proportions, disciplined spacing, strong vertical rhythm, highly readable Hangul",
    rounded: "rounded bold Korean display lettering with friendly proportions, clean edges, limited outline, highly readable Hangul",
    marker: "hand-drawn marker-inspired Korean lettering with controlled stroke variation, natural human rhythm, readable Hangul",
    geometric: "geometric Korean display lettering with precise modular rhythm, clean corners, controlled outline, highly readable Hangul",
    outline: "bold Korean display lettering using selective outline treatment and solid fills, experimental but highly readable Hangul",
    massive: "oversized massive Korean headline typography with dramatic scale hierarchy, compact spacing, strong readable silhouettes"
  };
  return prompts[typography];
}

function getCompositionPrompt(composition: DesignComposition, size: ImageSize) {
  const { width, height } = parseImageSize(size);
  const isSquare = height >= width * 0.9;
  const prompts: Record<DesignComposition, string> = {
    "left-asymmetric": "left-anchored asymmetric headline block, uneven but intentional line lengths, generous transparent breathing room on the right",
    "right-asymmetric": "right-anchored asymmetric headline block with transparent breathing room on the left and small motifs balancing the opposite edge",
    "center-stacked": "center-stacked headline with clear vertical hierarchy and controlled surrounding motifs; centered composition is intentional for this DNA only",
    split: "split composition: two related headline zones with a visible gap or divider, not a centered single block",
    "diagonal-flow": "asymmetric diagonal visual flow while keeping individual Korean text lines mostly horizontal and readable; small motifs can travel diagonally",
    "modular-grid": "modular grid composition with headline lines occupying offset grid cells; precise alignment and clear negative space",
    "top-heavy": "top-heavy headline composition with the largest phrase near the upper area and supporting title line below, leaving transparent lower breathing room"
  };
  return `${prompts[composition]}. ${isSquare ? "Use the square canvas dynamically without making a centered badge." : "Use the wide canvas from edge to edge while preserving safe transparent margins."}`;
}

function getDecorationRule(density: DesignDensity, graphicLanguage: DesignGraphicLanguage) {
  const count = density === "minimal" ? "0 to 2" : density === "balanced" ? "2 to 4" : "4 to 7";
  const language: Record<DesignGraphicLanguage, string> = {
    "abstract-shapes": "abstract shapes, contours, cropped geometry, and rhythm marks",
    "line-art": "thin line-art marks and open contours",
    "semantic-icons": "small semantic icons tied directly to the education topic",
    "geometric-symbols": "simple geometric symbols, modules, nodes, and directional marks",
    "collage-cutout": "small cutout-like graphic fragments with clean isolated edges",
    diagrammatic: "tiny diagram nodes, connectors, steps, or flow marks",
    "marker-doodles": "controlled marker doodles, loops, underlines, and hand-drawn marks",
    none: "almost no decorative graphics; rely on typography and negative space"
  };
  return `Decoration density: ${count} small motifs. Graphic language: ${language[graphicLanguage]}. Keep every motif subordinate to the title.`;
}

function normalizeDecorations(decorations: string[], dna: DesignDNA, seed: number) {
  const fallback = getGraphicFallbackDecorations(dna.graphicLanguage);
  const merged = Array.from(new Set([...decorations.filter(Boolean), ...fallback]));
  const desired = dna.density === "minimal" ? 2 : dna.density === "balanced" ? 3 : 4;
  if (merged.length <= desired) return merged;
  const offset = seed % merged.length;
  return [...merged.slice(offset), ...merged.slice(0, offset)].slice(0, desired);
}

function getGraphicFallbackDecorations(graphicLanguage: DesignGraphicLanguage) {
  const values: Record<DesignGraphicLanguage, string[]> = {
    "abstract-shapes": ["offset contour line", "cropped abstract circle", "small rhythm dot"],
    "line-art": ["thin open curve", "short contour line", "small line notch"],
    "semantic-icons": ["one small topic symbol", "tiny supporting symbol", "short underline"],
    "geometric-symbols": ["small open square", "node dot", "short directional mark"],
    "collage-cutout": ["small cutout blob", "rounded tab shape", "tiny paper-like abstract fragment"],
    diagrammatic: ["two connected nodes", "small step marker", "thin flow arrow"],
    "marker-doodles": ["marker loop", "hand-drawn underline", "tiny doodle spark"],
    none: ["single thin divider", "tiny registration dot"]
  };
  return values[graphicLanguage];
}

function createStableHash(value: string) {
  return createNumericHash(value).toString(36);
}

function createNumericHash(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}
