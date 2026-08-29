import { getAnalysisModel } from "@/lib/openai-models";
import { getOpenAIClient } from "@/lib/openaiClient";
import type {
  CandidateId,
  DesignComposition,
  DesignDensity,
  DesignDNA,
  DesignEmphasis,
  DesignGraphicLanguage,
  DesignShapeLanguage,
  DesignStyleFamily,
  DesignTypography,
  EducationImageForm
} from "@/lib/generativeTypes";

export type DirectedCandidate = {
  designDNA: DesignDNA;
  direction: string;
  visualMetaphor: string;
  coreEmotions: string[];
  keywords: string[];
  decorations: string[];
};

export type DesignDirectorResult = {
  contentSummary: string;
  audienceIntent: string;
  topicCategories: string[];
  candidates: Record<CandidateId, DirectedCandidate>;
  model?: string;
};

const styleFamilies: DesignStyleFamily[] = [
  "editorial",
  "bold-type",
  "hand-drawn",
  "geometric",
  "sticker",
  "minimal",
  "diagram",
  "experimental"
];
const compositions: DesignComposition[] = [
  "left-asymmetric",
  "right-asymmetric",
  "center-stacked",
  "split",
  "diagonal-flow",
  "modular-grid",
  "top-heavy"
];
const typographyStyles: DesignTypography[] = ["editorial", "condensed", "rounded", "marker", "geometric", "outline", "massive"];
const graphicLanguages: DesignGraphicLanguage[] = [
  "abstract-shapes",
  "line-art",
  "semantic-icons",
  "geometric-symbols",
  "collage-cutout",
  "diagrammatic",
  "marker-doodles",
  "none"
];
const densities: DesignDensity[] = ["minimal", "balanced", "rich"];
const emphasisStyles: DesignEmphasis[] = ["size-hierarchy", "color-block", "underline", "outline", "rotation", "highlight-shape"];
const shapeLanguages: DesignShapeLanguage[] = ["rounded", "angular", "organic", "geometric"];

export async function createDesignDirectionsWithOpenAI(form: EducationImageForm): Promise<DesignDirectorResult> {
  const model = getAnalysisModel();
  const recentDesignSignatures = (form.recentDesignSignatures ?? []).slice(0, 12);

  const response = await getOpenAIClient().responses.create({
    model,
    instructions: [
      "You are the design director for Human Impact Cooperative, a Korean social-welfare education organization.",
      "Plan TWO title-image directions that are intentionally and visibly different from each other.",
      "The output will become an isolated transparent Korean title PNG, not a full poster.",
      "Use the education title, promotion copy, topics, and audiences as semantic context.",
      "Do not merely change colors. Difference must come from composition, typography, graphic language, emphasis, density, and shape language.",
      "Avoid repeating recent design signatures when alternatives fit the content.",
      "Prefer abstract visual metaphors over literal hearts, leaves, speech bubbles, or handshakes unless they are unusually appropriate.",
      "Keep Korean headline readability high. Do not propose people, photographs, scenes, cards, panels, logos, or opaque backgrounds.",
      "Return only a valid JSON object."
    ].join("\n"),
    input: JSON.stringify({
      task: "Create two materially different Design DNA directions for the education title generator.",
      responseFormat: "json_object",
      instruction: "Return JSON only.",
      form: {
        title: form.title,
        promotionCopy: form.promotionCopy,
        topics: form.topics,
        audiences: form.audiences,
        size: form.size
      },
      recentDesignSignatures,
      allowedValues: {
        styleFamily: styleFamilies,
        composition: compositions,
        typography: typographyStyles,
        graphicLanguage: graphicLanguages,
        density: densities,
        emphasis: emphasisStyles,
        shapeLanguage: shapeLanguages
      },
      requiredShape: {
        contentSummary: "short Korean sentence",
        audienceIntent: "short Korean phrase",
        topicCategories: ["2-4 short Korean or English category labels"],
        candidates: {
          "option-1": {
            label: "short Korean design direction name",
            direction: "one Korean sentence describing the visual direction",
            rationale: "short Korean rationale connected to the education content",
            styleFamily: "one allowed value",
            composition: "one allowed value",
            typography: "one allowed value",
            graphicLanguage: "one allowed value",
            density: "one allowed value",
            emphasis: "one allowed value",
            shapeLanguage: "one allowed value",
            mood: "short Korean mood phrase",
            visualMetaphor: "specific non-literal Korean visual metaphor",
            coreEmotions: ["3 Korean emotion/tone words"],
            keywords: ["5 concise semantic keywords"],
            decorations: ["2-4 small visual motifs in English for image generation"]
          },
          "option-2": "same shape, but visibly different from option-1 on at least four Design DNA axes"
        }
      }
    }),
    text: {
      format: { type: "json_object" },
      verbosity: "low"
    },
    store: false
  });

  if (!response.output_text) {
    throw new Error("AI 디자인 디렉터 응답이 비어 있습니다.");
  }

  const parsed = parseJsonObject(response.output_text) as Record<string, unknown>;
  const rawCandidates = asRecord(parsed.candidates);
  const option1 = parseCandidate(asRecord(rawCandidates["option-1"]), "option-1");
  const option2 = ensureCandidateDiversity(option1, parseCandidate(asRecord(rawCandidates["option-2"]), "option-2"));

  return {
    contentSummary: asString(parsed.contentSummary, createContentSummaryFallback(form)),
    audienceIntent: asString(parsed.audienceIntent, form.audiences.slice(0, 2).join(", ") || "사회복지 실무자"),
    topicCategories: asStringArray(parsed.topicCategories, 4),
    candidates: {
      "option-1": option1,
      "option-2": option2
    },
    model
  };
}

function parseCandidate(raw: Record<string, unknown>, candidateId: CandidateId): DirectedCandidate {
  const styleFamily = asEnum(raw.styleFamily, styleFamilies, candidateId === "option-1" ? "editorial" : "geometric");
  const composition = asEnum(raw.composition, compositions, candidateId === "option-1" ? "left-asymmetric" : "modular-grid");
  const typography = asEnum(raw.typography, typographyStyles, candidateId === "option-1" ? "editorial" : "geometric");
  const graphicLanguage = asEnum(
    raw.graphicLanguage,
    graphicLanguages,
    candidateId === "option-1" ? "abstract-shapes" : "diagrammatic"
  );
  const density = asEnum(raw.density, densities, candidateId === "option-1" ? "minimal" : "balanced");
  const emphasis = asEnum(raw.emphasis, emphasisStyles, candidateId === "option-1" ? "size-hierarchy" : "color-block");
  const shapeLanguage = asEnum(raw.shapeLanguage, shapeLanguages, candidateId === "option-1" ? "organic" : "geometric");
  const label = asString(raw.label, candidateId === "option-1" ? "에디토리얼 변주" : "구조적 그래픽");
  const mood = asString(raw.mood, candidateId === "option-1" ? "차분하고 선명함" : "활기 있고 구조적임");
  const rationale = asString(raw.rationale, "교육 내용과 대상자의 인상을 시각적으로 구분해 전달합니다.");
  const designDNA: DesignDNA = {
    styleFamily,
    composition,
    typography,
    graphicLanguage,
    density,
    emphasis,
    shapeLanguage,
    mood,
    label,
    rationale,
    noveltyKey: buildNoveltyKey({ styleFamily, composition, typography, graphicLanguage, density, emphasis, shapeLanguage })
  };

  return {
    designDNA,
    direction: asString(raw.direction, `${label}: ${mood}`),
    visualMetaphor: asString(raw.visualMetaphor, candidateId === "option-1" ? "겹쳐지는 리듬과 열린 여백" : "모듈이 연결되며 확장되는 구조"),
    coreEmotions: ensureLength(asStringArray(raw.coreEmotions, 3), ["명확함", "신뢰감", "활기"], 3),
    keywords: ensureLength(asStringArray(raw.keywords, 5), ["교육", "현장", "실천", "성장", "연결"], 5),
    decorations: ensureLength(
      asStringArray(raw.decorations, 4),
      candidateId === "option-1" ? ["overlapping contour lines", "small offset dot"] : ["modular corner marks", "small node grid"],
      2
    ).slice(0, 4)
  };
}

function ensureCandidateDiversity(first: DirectedCandidate, second: DirectedCandidate): DirectedCandidate {
  const axes: Array<keyof Pick<DesignDNA, "styleFamily" | "composition" | "typography" | "graphicLanguage" | "density" | "emphasis" | "shapeLanguage">> = [
    "styleFamily",
    "composition",
    "typography",
    "graphicLanguage",
    "density",
    "emphasis",
    "shapeLanguage"
  ];
  const differenceCount = axes.reduce((count, axis) => count + (first.designDNA[axis] === second.designDNA[axis] ? 0 : 1), 0);

  if (differenceCount >= 4) {
    return second;
  }

  const nextDNA: DesignDNA = {
    ...second.designDNA,
    styleFamily: nextDifferent(styleFamilies, first.designDNA.styleFamily, 3),
    composition: nextDifferent(compositions, first.designDNA.composition, 3),
    typography: nextDifferent(typographyStyles, first.designDNA.typography, 2),
    graphicLanguage: nextDifferent(graphicLanguages, first.designDNA.graphicLanguage, 4),
    emphasis: nextDifferent(emphasisStyles, first.designDNA.emphasis, 3),
    shapeLanguage: nextDifferent(shapeLanguages, first.designDNA.shapeLanguage, 2)
  };
  nextDNA.noveltyKey = buildNoveltyKey(nextDNA);

  return {
    ...second,
    designDNA: nextDNA,
    direction: `${second.direction} 첫 번째 시안과 구도·타이포·그래픽 언어가 확실히 다르게 보이도록 구성합니다.`
  };
}

function nextDifferent<T extends string>(values: readonly T[], current: T, offset: number): T {
  const index = Math.max(0, values.indexOf(current));
  return values[(index + offset) % values.length] ?? values[0];
}

function buildNoveltyKey(value: Pick<DesignDNA, "styleFamily" | "composition" | "typography" | "graphicLanguage" | "density" | "emphasis" | "shapeLanguage">) {
  return [
    value.styleFamily,
    value.composition,
    value.typography,
    value.graphicLanguage,
    value.density,
    value.emphasis,
    value.shapeLanguage
  ].join("|");
}

function createContentSummaryFallback(form: EducationImageForm) {
  const details = [form.promotionCopy, ...form.topics.slice(0, 2)].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  return details.slice(0, 180) || form.title;
}

function parseJsonObject(text: string) {
  const trimmed = text.trim();
  const json = trimmed.startsWith("{") ? trimmed : trimmed.match(/\{[\s\S]*\}/)?.[0];

  if (!json) {
    throw new Error("AI 디자인 디렉터가 JSON을 반환하지 않았습니다.");
  }

  return JSON.parse(json);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asStringArray(value: unknown, maxLength: number) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim())
    .slice(0, maxLength);
}

function ensureLength(values: string[], fallback: string[], minimum: number) {
  const next = Array.from(new Set([...values, ...fallback]));
  return next.slice(0, Math.max(minimum, values.length));
}

function asEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
}
