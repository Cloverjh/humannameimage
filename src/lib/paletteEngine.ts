import type { CandidateId, EducationImageForm, ManualPalette, PaletteColor, PaletteRole } from "@/lib/generativeTypes";

type PaletteRoleMap = Record<PaletteRole, { name: string; hex: string }>;

export type PaletteChoice = {
  familyId: string;
  familyName: string;
  label: string;
  palette: PaletteColor[];
  score: number;
  distanceFromOption1?: number;
};

type PaletteFamily = {
  id: string;
  label: string;
  tags: string[];
  colors: PaletteRoleMap;
};

type VariantInput = {
  id: CandidateId;
  seedOffset: number;
  warmth: "soft" | "structured";
};

const roleUsage: Record<PaletteRole, string> = {
  primary: "Primary headline / 제목 중심 색상",
  secondary: "Secondary headline accent / 제목 두 번째 강조",
  accent: "Small decorative icons and emphasis dots / 하트, 점, 강조 아이콘",
  supporting: "Supporting details and line accents / 잎사귀, 선, 보조 장식",
  neutral: "Outline, shadow control, and readability support / 외곽선과 안정적인 보조색"
};

export const defaultManualPalette: ManualPalette = {
  enabled: false,
  primary: "#3155A5",
  secondary: "#D9A441",
  accent: "#F3CE55",
  supporting: "#71A8D8",
  neutral: "#1B2438"
};

export const colorFamilyLibrary: PaletteFamily[] = [
  family("Forest", "포레스트 그린", ["community", "care", "reflective", "nature", "trust", "growth"], {
    primary: ["포레스트 그린", "#1F6B4E"],
    secondary: ["크림", "#F6F1E3"],
    accent: ["머스타드", "#D49A2A"],
    supporting: ["소프트 리프", "#7FA37A"],
    neutral: ["딥 그린 차콜", "#24352F"]
  }),
  family("Ocean", "딥 오션", ["counseling", "care", "calm", "trust", "professional"], {
    primary: ["딥 블루", "#1F4E79"],
    secondary: ["스카이블루", "#6DB7E8"],
    accent: ["라이트 그레이", "#E9EEF2"],
    supporting: ["페일 아쿠아", "#A6CAD8"],
    neutral: ["잉크 네이비", "#1D2935"]
  }),
  family("Lavender", "차분한 라벤더", ["counseling", "reflective", "emotion", "psychology", "soft"], {
    primary: ["라벤더", "#A58AD4"],
    secondary: ["딥 퍼플", "#51386E"],
    accent: ["연한 핑크", "#F3C6D9"],
    supporting: ["페일 라벤더", "#EFE8F7"],
    neutral: ["플럼 블랙", "#2F2540"]
  }),
  family("Terracotta", "따뜻한 테라코타", ["community", "care", "warm", "field", "relationship"], {
    primary: ["테라코타", "#B65C42"],
    secondary: ["샌드", "#E6C7A5"],
    accent: ["올리브", "#6F7A52"],
    supporting: ["라이트 샌드", "#F7EEE2"],
    neutral: ["웜 차콜", "#3A3028"]
  }),
  family("Mustard", "머스타드 네이비", ["practice", "community", "energy", "clear", "work"], {
    primary: ["머스타드", "#D6A22A"],
    secondary: ["네이비", "#172A4A"],
    accent: ["아이보리", "#FFF7E0"],
    supporting: ["슬레이트 블루", "#7E8CA3"],
    neutral: ["딥 슬레이트", "#252D3A"]
  }),
  family("Burgundy", "버건디 크림", ["counseling", "care", "professional", "warm", "depth"], {
    primary: ["버건디", "#8E2F45"],
    secondary: ["더스티핑크", "#D9A0AA"],
    accent: ["크림", "#FFF0D8"],
    supporting: ["뮤트 블루", "#6B809C"],
    neutral: ["딥 와인", "#2E1F28"]
  }),
  family("Cobalt", "선명한 코발트", ["practice", "counseling", "community", "professional", "clear", "technology"], {
    primary: ["코발트블루", "#3155A5"],
    secondary: ["라이트블루", "#71A8D8"],
    accent: ["레몬", "#F3CE55"],
    supporting: ["소프트 아이보리", "#F5F2EA"],
    neutral: ["딥 네이비", "#1B2438"]
  }),
  family("Mint", "민트 네이비", ["practice", "care", "fresh", "tool", "friendly"], {
    primary: ["민트", "#62CBB6"],
    secondary: ["딥네이비", "#14233D"],
    accent: ["피치", "#F2A98E"],
    supporting: ["페일 민트", "#D9F3EA"],
    neutral: ["차콜", "#1F2937"]
  }),
  family("Orange", "번트오렌지 차콜", ["practice", "promotion", "active", "field", "impact"], {
    primary: ["번트오렌지", "#C65A1E"],
    secondary: ["차콜", "#2C3138"],
    accent: ["크림", "#FFF1D7"],
    supporting: ["소프트 앰버", "#E2B678"],
    neutral: ["블랙 차콜", "#202020"]
  }),
  family("Plum", "플럼 라일락", ["reflective", "counseling", "depth", "emotion", "growth"], {
    primary: ["플럼", "#6B3F73"],
    secondary: ["라일락", "#C9A7D8"],
    accent: ["아이보리", "#FFF5E7"],
    supporting: ["더스티 로즈", "#D28BA3"],
    neutral: ["딥 플럼", "#2A2430"]
  }),
  family("Sky", "스카이블루 코랄", ["promotion", "community", "bright", "friendly", "communication"], {
    primary: ["스카이블루", "#71BEEA"],
    secondary: ["코랄", "#E87461"],
    accent: ["네이비", "#1D2D50"],
    supporting: ["페일 스카이", "#EFF7FA"],
    neutral: ["블루 차콜", "#263238"]
  }),
  family("Lime", "올리브 라임", ["practice", "community", "fresh", "action", "growth"], {
    primary: ["올리브", "#6F7F3D"],
    secondary: ["라임", "#B8D94A"],
    accent: ["딥그린", "#173F35"],
    supporting: ["라이트 세이지", "#F5F1DA"],
    neutral: ["그린 블랙", "#1F2A24"]
  }),
  family("Monochrome", "모노크롬 포인트", ["practice", "professional", "clear", "minimal", "graphic"], {
    primary: ["블랙", "#111111"],
    secondary: ["웜그레이", "#8A817C"],
    accent: ["골드 포인트", "#F0C04A"],
    supporting: ["라이트 그레이", "#E0D8CF"],
    neutral: ["차콜", "#2E2E2E"]
  }),
  family("Red", "브릭레드 크림", ["care", "promotion", "urgent", "warm", "field"], {
    primary: ["브릭레드", "#A94432"],
    secondary: ["크림", "#FFF0D6"],
    accent: ["블루그레이", "#6D8496"],
    supporting: ["소프트 오렌지", "#DDA15E"],
    neutral: ["딥 잉크", "#2B2D42"]
  }),
  family("Yellow", "소프트 옐로", ["reflective", "promotion", "warm", "learning", "hope"], {
    primary: ["소프트 옐로", "#F4D35E"],
    secondary: ["브라운", "#5A3E2B"],
    accent: ["딥블루", "#24476D"],
    supporting: ["아이보리", "#FFF8E1"],
    neutral: ["웜 블랙", "#252422"]
  }),
  family("Pink", "더스티핑크 와인", ["counseling", "care", "soft", "warm", "relationship"], {
    primary: ["더스티핑크", "#D68BA5"],
    secondary: ["와인", "#6C2135"],
    accent: ["라이트베이지", "#F5E8D6"],
    supporting: ["그레이 민트", "#8EA6A2"],
    neutral: ["와인 차콜", "#2E2733"]
  })
];

export function chooseCandidatePalettes(
  form: EducationImageForm,
  classification: string,
  variants: Record<CandidateId, VariantInput>
): Record<CandidateId, PaletteChoice> {
  if (form.manualPalette?.enabled) {
    const choice = createManualPaletteChoice(form.manualPalette);
    return {
      "option-1": choice,
      "option-2": { ...choice, distanceFromOption1: 0 }
    };
  }

  const recentFamilies = new Set((form.recentColorFamilies ?? []).slice(0, 8));
  const ranked = colorFamilyLibrary
    .map((paletteFamily) => {
      const baseScore =
        relevanceScore(paletteFamily, form, classification) * 0.45 +
        internalContrastScore(paletteFamily) * 0.2 +
        recentNoveltyScore(paletteFamily, recentFamilies) * 0.2 +
        visualFreshnessScore(paletteFamily, form.styleSeed) * 0.15;

      return { paletteFamily, score: baseScore };
    })
    .sort((first, second) => second.score - first.score);

  const option1 = ranked[0] ?? { paletteFamily: colorFamilyLibrary[0], score: 1 };
  const option2 =
    ranked
      .slice(1)
      .map((candidate) => ({
        ...candidate,
        distanceFromOption1: paletteDistance(candidate.paletteFamily, option1.paletteFamily)
      }))
      .filter((candidate) => candidate.distanceFromOption1 >= 0.35)
      .sort((first, second) => second.score + second.distanceFromOption1 * 0.25 - (first.score + first.distanceFromOption1 * 0.25))[0] ??
    ranked[1] ??
    option1;

  return {
    "option-1": toChoice(option1.paletteFamily, option1.score, variants["option-1"]),
    "option-2": toChoice(
      option2.paletteFamily,
      option2.score,
      variants["option-2"],
      paletteDistance(option2.paletteFamily, option1.paletteFamily)
    )
  };
}

export function formatPaletteForPrompt(palette: PaletteColor[]) {
  return palette
    .map((color) => `- ${roleLabel(color.role)}: ${color.name} ${color.hex} (${color.usage})`)
    .join("\n");
}

export function getPaletteHexList(palette: PaletteColor[]) {
  return palette.map((color) => color.hex);
}

function createManualPaletteChoice(manualPalette: ManualPalette): PaletteChoice {
  const palette = toPalette("Custom", "직접 지정", {
    primary: { name: "직접 지정 primary", hex: manualPalette.primary },
    secondary: { name: "직접 지정 secondary", hex: manualPalette.secondary },
    accent: { name: "직접 지정 accent", hex: manualPalette.accent },
    supporting: { name: "직접 지정 supporting", hex: manualPalette.supporting },
    neutral: { name: "직접 지정 neutral", hex: manualPalette.neutral }
  });

  return {
    familyId: "Custom",
    familyName: "직접 지정",
    label: "직접 지정 색상",
    palette,
    score: 1
  };
}

function family(id: string, label: string, tags: string[], rawColors: Record<PaletteRole, [string, string]>): PaletteFamily {
  return {
    id,
    label,
    tags,
    colors: Object.fromEntries(
      Object.entries(rawColors).map(([role, [name, hex]]) => [role, { name, hex }])
    ) as PaletteRoleMap
  };
}

function toChoice(family: PaletteFamily, score: number, variant: VariantInput, distanceFromOption1?: number): PaletteChoice {
  const label = variant.warmth === "soft" ? `${family.label} · 따뜻한 제안` : `${family.label} · 선명한 제안`;

  return {
    familyId: family.id,
    familyName: family.label,
    label,
    palette: toPalette(family.id, family.label, family.colors),
    score,
    distanceFromOption1
  };
}

function toPalette(familyId: string, familyLabel: string, colors: PaletteRoleMap): PaletteColor[] {
  return (["primary", "secondary", "accent", "supporting", "neutral"] as PaletteRole[]).map((role) => ({
    name: colors[role].name,
    hex: colors[role].hex,
    usage: roleUsage[role],
    role,
    family: familyId === "Custom" ? familyLabel : `${familyId} / ${familyLabel}`
  }));
}

function relevanceScore(family: PaletteFamily, form: EducationImageForm, classification: string) {
  const source = `${classification} ${form.title} ${form.promotionCopy} ${form.topics.join(" ")} ${form.audiences.join(" ")}`.toLowerCase();
  const categoryHit = family.tags.includes(classification) ? 0.42 : 0;
  const contentHits = family.tags.filter((tag) => source.includes(tag.toLowerCase())).length;
  const koreanHints = getKoreanHintHits(family.id, source);

  return clamp01(0.34 + categoryHit + contentHits * 0.08 + koreanHints * 0.08);
}

function getKoreanHintHits(familyId: string, source: string) {
  const hints: Record<string, RegExp[]> = {
    Forest: [/공동체|돌봄|성장|회복|관계/],
    Ocean: [/신뢰|상담|안정|전문|차분/],
    Lavender: [/상담|심리|마음|성찰|감정/],
    Terracotta: [/주민|조직화|마을|현장|연결/],
    Mustard: [/실무|도구|기획|전문|실행/],
    Burgundy: [/사례관리|상담|돌봄|관계|깊이/],
    Cobalt: [/AI|스마트|전문|기술|자동화|사례관리/],
    Mint: [/도구|실무|돌봄|건강|새로운/],
    Orange: [/실천|현장|도전|실행|성과/],
    Plum: [/성찰|철학|인권|존엄|마음/],
    Sky: [/홍보|소통|전달|관계|교육/],
    Lime: [/실천|성장|현장|주민|업무/],
    Monochrome: [/전문|관리|전략|보고|성과/],
    Red: [/위기|안전|돌봄|긴급|현장/],
    Yellow: [/학습|희망|성장|회복|입문/],
    Pink: [/관계|상담|돌봄|마음|신뢰/]
  };

  return (hints[familyId] ?? []).filter((pattern) => pattern.test(source)).length;
}

function internalContrastScore(family: PaletteFamily) {
  const roles: PaletteRole[] = ["primary", "secondary", "accent", "supporting"];
  const hues = roles.map((role) => hexToHsl(family.colors[role].hex).h);
  const distances: number[] = [];

  for (let first = 0; first < hues.length; first += 1) {
    for (let second = first + 1; second < hues.length; second += 1) {
      distances.push(hueDistance(hues[first], hues[second]) / 180);
    }
  }

  const maxDistance = Math.max(...distances);
  const averageDistance = distances.reduce((sum, value) => sum + value, 0) / distances.length;
  const primaryAccentDistance = hueDistance(hexToHsl(family.colors.primary.hex).h, hexToHsl(family.colors.accent.hex).h) / 180;

  return clamp01(maxDistance * 0.35 + averageDistance * 0.35 + primaryAccentDistance * 0.3);
}

function recentNoveltyScore(family: PaletteFamily, recentFamilies: Set<string>) {
  if (recentFamilies.has(family.id) || recentFamilies.has(family.label)) {
    return 0.18;
  }

  return 1;
}

function visualFreshnessScore(family: PaletteFamily, seed: number) {
  const hash = createStableHash(`${family.id}-${seed}`);
  return 0.55 + (hash % 45) / 100;
}

function paletteDistance(first: PaletteFamily, second: PaletteFamily) {
  if (first.id === second.id) {
    return 0;
  }

  const roles: PaletteRole[] = ["primary", "secondary", "accent", "supporting"];
  const distances = roles.map((role) => {
    const firstHsl = hexToHsl(first.colors[role].hex);
    const secondHsl = hexToHsl(second.colors[role].hex);
    const hue = hueDistance(firstHsl.h, secondHsl.h) / 180;
    const saturation = Math.abs(firstHsl.s - secondHsl.s);
    const lightness = Math.abs(firstHsl.l - secondHsl.l);
    return hue * 0.7 + saturation * 0.15 + lightness * 0.15;
  });

  return clamp01(distances.reduce((sum, value) => sum + value, 0) / distances.length);
}

function roleLabel(role?: PaletteRole) {
  const labels: Record<PaletteRole, string> = {
    primary: "Primary headline",
    secondary: "Secondary headline accent",
    accent: "Small decorative icons",
    supporting: "Supporting detail",
    neutral: "Neutral outline/support"
  };

  return role ? labels[role] : "Palette color";
}

function hexToHsl(hex: string) {
  const normalized = hex.replace("#", "");
  const red = parseInt(normalized.slice(0, 2), 16) / 255;
  const green = parseInt(normalized.slice(2, 4), 16) / 255;
  const blue = parseInt(normalized.slice(4, 6), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case red:
        h = (green - blue) / d + (green < blue ? 6 : 0);
        break;
      case green:
        h = (blue - red) / d + 2;
        break;
      default:
        h = (red - green) / d + 4;
    }
    h *= 60;
  }

  return { h, s, l };
}

function hueDistance(first: number, second: number) {
  const diff = Math.abs(first - second) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function createStableHash(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash);
}
