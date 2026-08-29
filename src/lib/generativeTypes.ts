export type OutputType = "decorated-title" | "title-only" | "icons-only";
export type CandidateId = "option-1" | "option-2";
export type TextMode = "with-text" | "without-text";
export type ImageQuality = "high";
export type ImageSize = "1500x730" | "1500x416" | "1500x1500";
export type PaletteRole = "primary" | "secondary" | "accent" | "supporting" | "neutral";

export type DesignStyleFamily =
  | "editorial"
  | "bold-type"
  | "hand-drawn"
  | "geometric"
  | "sticker"
  | "minimal"
  | "diagram"
  | "experimental";

export type DesignComposition =
  | "left-asymmetric"
  | "right-asymmetric"
  | "center-stacked"
  | "split"
  | "diagonal-flow"
  | "modular-grid"
  | "top-heavy";

export type DesignTypography =
  | "editorial"
  | "condensed"
  | "rounded"
  | "marker"
  | "geometric"
  | "outline"
  | "massive";

export type DesignGraphicLanguage =
  | "abstract-shapes"
  | "line-art"
  | "semantic-icons"
  | "geometric-symbols"
  | "collage-cutout"
  | "diagrammatic"
  | "marker-doodles"
  | "none";

export type DesignDensity = "minimal" | "balanced" | "rich";
export type DesignEmphasis = "size-hierarchy" | "color-block" | "underline" | "outline" | "rotation" | "highlight-shape";
export type DesignShapeLanguage = "rounded" | "angular" | "organic" | "geometric";

export interface DesignDNA {
  styleFamily: DesignStyleFamily;
  composition: DesignComposition;
  typography: DesignTypography;
  graphicLanguage: DesignGraphicLanguage;
  density: DesignDensity;
  emphasis: DesignEmphasis;
  shapeLanguage: DesignShapeLanguage;
  mood: string;
  label: string;
  rationale: string;
  noveltyKey: string;
}

export interface ManualPalette {
  enabled: boolean;
  primary: string;
  secondary: string;
  accent: string;
  supporting: string;
  neutral: string;
}

export type PaletteRoleMap = Record<PaletteRole, string>;

export interface RecolorMetadata {
  version: number;
  baseVersion: number;
  palette: PaletteRoleMap;
  preservedLayout: boolean;
  preservedLineBreaks: boolean;
  method: "client-recolor" | "server-recolor" | "image-edit";
  createdAt: string;
  sourceImageId?: string;
  options?: {
    titleColors: boolean;
    iconColors: boolean;
    decorationColors: boolean;
    emphasisColors: boolean;
    outlineColors?: boolean;
  };
  extractedColors?: string[];
  colorRoles?: Record<string, number>;
}

export interface EducationImageForm {
  title: string;
  promotionCopy: string;
  topics: string[];
  audiences: string[];
  outputType: OutputType;
  textMode: TextMode;
  quality: ImageQuality;
  size: ImageSize;
  styleSeed: number;
  recentColorFamilies?: string[];
  recentDesignSignatures?: string[];
  designDNAOverrides?: Partial<Record<CandidateId, DesignDNA>>;
  manualPalette?: ManualPalette;
}

export interface PaletteColor {
  name: string;
  hex: string;
  usage: string;
  role?: PaletteRole;
  family?: string;
}

export interface DesignSpec {
  id: string;
  candidateId?: CandidateId;
  candidateLabel?: string;
  variantDirection?: string;
  designDNA: DesignDNA;
  coreEmotions: string[];
  coreEmotion: string;
  keywords: string[];
  topicCategory: string;
  topicCategories?: string[];
  contentSummary?: string;
  audienceIntent?: string;
  visualMetaphor: string;
  palette: PaletteColor[];
  paletteFamily?: string;
  paletteLabel?: string;
  paletteScore?: number;
  paletteDistanceFromOption1?: number;
  typographyStyle: string;
  lineBreakPlan: string;
  titlePlacement: string;
  decorations: string[];
  emphasisWords: string[];
  avoid: string[];
  size: ImageSize;
}

export interface PromptAnalysis {
  coreEmotions: string[];
  coreEmotion: string;
  keywords: string[];
  visualMetaphor: string;
  recommendedColors: string[];
  avoid: string[];
  titlePlacement: string;
  typographyStyle: string;
  aspectRatio: string;
  transparentBackground: boolean;
  designSpecId?: string;
}

export interface GeneratedPrompt {
  analysis: PromptAnalysis;
  prompt: string;
  negativePrompt: string;
  palette: PaletteColor[];
  outputType: OutputType;
  textMode: TextMode;
  size: ImageSize;
  quality: ImageQuality;
  designSpec: DesignSpec;
  usedFallback?: boolean;
  model?: string;
}

export interface GeneratedPromptSet {
  id: string;
  designSpec: DesignSpec;
  prompts: Record<OutputType, GeneratedPrompt>;
  size: ImageSize;
  quality: ImageQuality;
  usedFallback?: boolean;
}

export interface GeneratedCandidateSet {
  id: string;
  candidates: Record<CandidateId, GeneratedPromptSet>;
  size: ImageSize;
  quality: ImageQuality;
  usedFallback?: boolean;
}

export type PngValidationStatus =
  | "VALID_TRANSPARENT_PNG"
  | "BACKGROUND_REMOVAL_APPLIED"
  | "CHECKERBOARD_DETECTED"
  | "NO_ALPHA_CHANNEL"
  | "LOW_TRANSPARENCY"
  | "WHITE_BACKGROUND_DETECTED"
  | "GRAY_BACKGROUND_DETECTED"
  | "BACKGROUND_REMAINS"
  | "PROCESSING_FAILED";

export interface PngValidationResult {
  status: PngValidationStatus;
  hasAlphaChannel: boolean;
  transparentPixelRatio: number;
  checkerboardDetected: boolean;
  checkerboardAlternatingRatio?: number;
  checkerboardColors?: string[];
  edgeOpaquePixelRatio?: number;
  backgroundDetected?: boolean;
  corrected: boolean;
  message?: string;
}

export type IconAssetKind = "actual" | "recommended";

export interface IconSpec {
  id: string;
  name: string;
  slug: string;
  promptLabel: string;
  fileLabel: string;
  sourceDecoration?: string;
  index: number;
}

export interface ThumbnailBackgroundSpec {
  id: string;
  label: string;
  direction: string;
  promptFocus: string;
  fileLabel: string;
  index: number;
}

export interface GeneratedIconAsset {
  id: string;
  kind: IconAssetKind;
  spec: IconSpec;
  name: string;
  slug: string;
  fileName: string;
  imageDataUrl: string;
  width: number;
  height: number;
  createdAt: string;
  sourceImageId?: string;
  sourceComponentIndex?: number;
  model?: string;
  operation?: "server-extract" | "client-recolor" | "server-recolor" | "edit" | "generation";
  prompt?: string;
  validationStatus?: PngValidationStatus;
  validation?: PngValidationResult;
  corrected?: boolean;
  recolor?: RecolorMetadata;
  retryCount?: number;
  timings?: {
    openaiMs?: number;
    processingMs: number;
    totalMs: number;
  };
}

export interface GeneratedBackgroundAsset {
  id: string;
  spec: ThumbnailBackgroundSpec;
  label: string;
  fileName: string;
  imageDataUrl: string;
  width: number;
  height: number;
  createdAt: string;
  sourceImageId?: string;
  model: string;
  operation: "generation";
  prompt: string;
  revisedPrompt?: string;
  usage?: unknown;
  apiSize?: string;
  timings?: {
    openaiMs: number;
    processingMs: number;
    totalMs: number;
  };
}

export interface GeneratedImage {
  id: string;
  imageDataUrl: string;
  prompt: GeneratedPrompt;
  createdAt: string;
  outputType: OutputType;
  size: ImageSize;
  quality: ImageQuality;
  model: string;
  usage?: unknown;
  revisedPrompt?: string;
  transparentRequested: boolean;
  background?: "transparent" | "opaque" | "auto";
  apiSize?: string;
  sourceImageId?: string;
  operation?: "generation" | "edit" | "client-recolor" | "server-recolor";
  validationStatus?: PngValidationStatus;
  validation?: PngValidationResult;
  corrected?: boolean;
  recolor?: RecolorMetadata;
  retryCount?: number;
  timings?: {
    openaiMs: number;
    resizeMs: number;
    totalMs: number;
  };
}
