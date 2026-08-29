import type { DesignGraphicLanguage, DesignSpec, EducationImageForm, IconSpec } from "@/lib/generativeTypes";

type IconDefinition = {
  slug: string;
  name: string;
  promptLabel: string;
  keywords: string[];
  styleTags?: Array<DesignGraphicLanguage | "abstract" | "literal">;
};

const iconDefinitions: IconDefinition[] = [
  { slug: "heart", name: "하트", promptLabel: "small heart line icon", keywords: ["heart", "하트", "care", "돌봄"], styleTags: ["semantic-icons", "literal"] },
  { slug: "leaf", name: "잎사귀", promptLabel: "leaf sprout icon", keywords: ["leaf", "sprout", "리프", "잎", "새싹"], styleTags: ["semantic-icons", "literal"] },
  { slug: "curve", name: "곡선", promptLabel: "gentle open curve icon", keywords: ["curve", "curved", "underline", "곡선"], styleTags: ["line-art", "abstract"] },
  { slug: "dotted-line", name: "점선", promptLabel: "small dotted rhythm line", keywords: ["dot", "dotted", "점선"], styleTags: ["line-art", "diagrammatic", "abstract"] },
  { slug: "speechbubble", name: "말풍선", promptLabel: "speech bubble icon", keywords: ["speech", "bubble", "말풍선", "대화"], styleTags: ["semantic-icons", "literal"] },
  { slug: "star", name: "별", promptLabel: "small star icon", keywords: ["star", "별"], styleTags: ["semantic-icons", "collage-cutout"] },
  { slug: "sparkle", name: "반짝임", promptLabel: "tiny sparkle icon", keywords: ["sparkle", "반짝"], styleTags: ["marker-doodles", "collage-cutout"] },
  { slug: "check", name: "체크", promptLabel: "check mark icon", keywords: ["check", "체크", "실행", "완료"], styleTags: ["semantic-icons", "diagrammatic"] },
  { slug: "tool", name: "도구", promptLabel: "simple tool symbol", keywords: ["tool", "도구", "실무"], styleTags: ["semantic-icons", "literal"] },
  { slug: "link", name: "연결고리", promptLabel: "open link connection symbol", keywords: ["link", "connected", "connection", "연결"], styleTags: ["geometric-symbols", "semantic-icons"] },
  { slug: "network", name: "관계망", promptLabel: "small network node symbol", keywords: ["network", "node", "관계망", "연결"], styleTags: ["diagrammatic", "geometric-symbols", "abstract"] },
  { slug: "question", name: "질문", promptLabel: "question mark symbol", keywords: ["question", "질문"], styleTags: ["semantic-icons", "literal"] },
  { slug: "memo", name: "메모", promptLabel: "small memo icon", keywords: ["memo", "note", "메모", "기록"], styleTags: ["semantic-icons", "literal"] },
  { slug: "quote", name: "따옴표", promptLabel: "simple quote mark", keywords: ["quote", "따옴표", "말", "대화"], styleTags: ["geometric-symbols", "semantic-icons"] },
  { slug: "shield", name: "보호", promptLabel: "open protective boundary symbol", keywords: ["shield", "protective", "보호", "안전"], styleTags: ["semantic-icons", "literal"] },
  { slug: "overlap", name: "겹침", promptLabel: "two overlapping open circles", keywords: ["관계", "겹침", "만남", "연결", "통합"], styleTags: ["abstract-shapes", "geometric-symbols", "abstract"] },
  { slug: "bridge", name: "브리지", promptLabel: "minimal bridge-like connection arc", keywords: ["연결", "관계", "중개", "브리지", "네트워크"], styleTags: ["line-art", "abstract-shapes", "abstract"] },
  { slug: "ripple", name: "파동", promptLabel: "two minimal expanding ripple arcs", keywords: ["확산", "영향", "전달", "변화", "소통"], styleTags: ["line-art", "abstract-shapes", "abstract"] },
  { slug: "steps", name: "단계", promptLabel: "three minimal ascending step blocks", keywords: ["과정", "실행", "단계", "성장", "성과"], styleTags: ["diagrammatic", "geometric-symbols", "abstract"] },
  { slug: "orbit", name: "궤도", promptLabel: "small orbit line with one offset dot", keywords: ["변화", "순환", "관계", "탐색", "확장"], styleTags: ["abstract-shapes", "line-art", "abstract"] },
  { slug: "weave", name: "직조", promptLabel: "two interlacing ribbon-like lines", keywords: ["관계", "연결", "공동체", "통합", "협력"], styleTags: ["line-art", "abstract-shapes", "abstract"] },
  { slug: "focus-ring", name: "초점", promptLabel: "offset focus ring symbol", keywords: ["집중", "핵심", "목표", "질문", "성과"], styleTags: ["geometric-symbols", "abstract"] },
  { slug: "flow-node", name: "흐름 노드", promptLabel: "two connected flow nodes with a short arrow", keywords: ["흐름", "과정", "프로세스", "실행", "기획"], styleTags: ["diagrammatic", "abstract"] },
  { slug: "open-frame", name: "열린 경계", promptLabel: "minimal open corner frame symbol", keywords: ["경계", "안전", "보호", "공간", "관계"], styleTags: ["geometric-symbols", "line-art", "abstract"] }
];

const categoryPreferredSlugs: Record<string, string[]> = {
  counseling: ["overlap", "ripple", "quote", "question", "focus-ring", "speechbubble", "memo", "heart"],
  community: ["weave", "network", "bridge", "overlap", "link", "orbit", "leaf", "heart"],
  practice: ["flow-node", "steps", "focus-ring", "check", "tool", "network", "orbit"],
  promotion: ["ripple", "orbit", "focus-ring", "quote", "sparkle", "speechbubble", "star"],
  reflective: ["orbit", "overlap", "open-frame", "quote", "curve", "memo", "star"],
  care: ["open-frame", "overlap", "bridge", "shield", "ripple", "heart", "leaf"]
};

export function getActualIconSpecs(decorations: string[]) {
  const specs = decorations.map((decoration, index) => {
    const definition = findDefinitionForText(decoration);
    return toSpec(definition, index, decoration);
  });
  const seen = new Set<string>();

  return specs.map((spec) => {
    if (!seen.has(spec.slug)) {
      seen.add(spec.slug);
      return spec;
    }

    return {
      ...spec,
      id: `${spec.id}-${spec.index + 1}`,
      fileLabel: `${spec.fileLabel}_${spec.index + 1}`
    };
  });
}

export function getRecommendedIconSpecs(form: EducationImageForm, designSpec: DesignSpec, actualSpecs: IconSpec[]) {
  const category = designSpec.topicCategory || classifyFromForm(form);
  const actualSlugs = new Set(actualSpecs.map((spec) => spec.slug));
  const source = [
    form.title,
    form.promotionCopy,
    ...form.topics,
    ...form.audiences,
    ...designSpec.keywords,
    designSpec.visualMetaphor
  ]
    .join(" ")
    .toLowerCase();
  const graphicLanguage = designSpec.designDNA?.graphicLanguage ?? "semantic-icons";
  const preferred = new Map((categoryPreferredSlugs[category] ?? []).map((slug, index) => [slug, Math.max(0, 8 - index)]));
  const seed = stableHash(`${form.title}|${designSpec.id}|${designSpec.designDNA?.noveltyKey ?? ""}`);

  const ranked = iconDefinitions
    .filter((definition) => !actualSlugs.has(definition.slug))
    .map((definition) => {
      const contentScore = definition.keywords.reduce(
        (total, keyword) => total + (source.includes(keyword.toLowerCase()) ? 5 : 0),
        0
      );
      const categoryScore = preferred.get(definition.slug) ?? 0;
      const styleScore = definition.styleTags?.includes(graphicLanguage) ? 7 : 0;
      const abstractBonus = graphicLanguage !== "semantic-icons" && definition.styleTags?.includes("abstract") ? 4 : 0;
      const literalPenalty = graphicLanguage !== "semantic-icons" && definition.styleTags?.includes("literal") ? -3 : 0;
      const freshness = stableHash(`${definition.slug}|${seed}`) % 5;
      return { definition, score: contentScore + categoryScore + styleScore + abstractBonus + literalPenalty + freshness };
    })
    .sort((first, second) => second.score - first.score || first.definition.slug.localeCompare(second.definition.slug));

  return ranked.slice(0, 3).map(({ definition }, index) => toSpec(definition, index));
}

export function getIconFileName(kind: "actual" | "recommended", spec: IconSpec) {
  const prefix = kind === "actual" ? "actual" : "recommended";
  return `${prefix}_${String(spec.index + 1).padStart(2, "0")}_${spec.fileLabel}.png`;
}

export function getSafeIconFileLabel(value: string) {
  return (
    value
      .normalize("NFC")
      .toLowerCase()
      .replace(/[^a-z0-9가-힣_-]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 36) || "icon"
  );
}

function findDefinition(slug: string) {
  return iconDefinitions.find((definition) => definition.slug === slug) ?? iconDefinitions[0];
}

function findDefinitionForText(text: string) {
  const normalized = text.toLowerCase();
  return (
    iconDefinitions.find((definition) => definition.keywords.some((keyword) => normalized.includes(keyword.toLowerCase()))) ??
    define(getSafeIconFileLabel(text), text, text, [text], ["abstract"])
  );
}

function toSpec(definition: IconDefinition, index: number, sourceDecoration?: string): IconSpec {
  return {
    id: `${definition.slug}-${index + 1}`,
    name: definition.name,
    slug: definition.slug,
    promptLabel: definition.promptLabel,
    fileLabel: getSafeIconFileLabel(definition.slug),
    sourceDecoration,
    index
  };
}

function define(
  slug: string,
  name: string,
  promptLabel: string,
  keywords: string[],
  styleTags?: IconDefinition["styleTags"]
): IconDefinition {
  return { slug, name, promptLabel, keywords, styleTags };
}

function classifyFromForm(form: EducationImageForm) {
  const source = `${form.title} ${form.promotionCopy} ${form.topics.join(" ")} ${form.audiences.join(" ")}`;
  const rules: Array<{ id: string; regex: RegExp }> = [
    { id: "community", regex: /주민|조직화|마을|공동체|고립|외로움|관계망|상호돌봄|타임뱅크|연결|지역복지/ },
    { id: "counseling", regex: /상담|사례관리|심리|경청|질문|신뢰|대화|면담|감정|소진|해결중심|슈퍼비전/ },
    { id: "practice", regex: /AI|인공지능|스마트|도구|자동화|업무|실무|현장|성과|기획|평가|엑셀|스프레드시트/ },
    { id: "promotion", regex: /홍보|마케팅|브랜드|콘텐츠|PR|소식|캠페인|포스터|카드뉴스/ },
    { id: "care", regex: /돌봄|의료|통합돌봄|안전|건강|중독|정신건강|위기/ },
    { id: "reflective", regex: /인권|존엄|철학|인문|글쓰기|리더십|조직|갈등|소통|성찰|마음|회복/ }
  ];
  return rules.find((rule) => rule.regex.test(source))?.id ?? "reflective";
}

function stableHash(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}
