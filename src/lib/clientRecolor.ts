import type { PaletteColor, PaletteRole, PaletteRoleMap, PngValidationResult } from "@/lib/generativeTypes";

export type ClientRecolorRole = PaletteRole | "darkOutline" | "lightOutline" | "preserve" | "transparent";

export type ClientRecolorSource = {
  imageData: ImageData;
  masks: Uint8Array;
  width: number;
  height: number;
  sourcePalette: PaletteRoleMap;
  sourceRoleHsl: Record<PaletteRole, Hsl>;
  extractedColors: string[];
  maskSummary: Record<ClientRecolorRole, number>;
};

export type ClientRecolorOptions = {
  outlineColors?: boolean;
  outlineColor?: string;
};

export type ClientRecolorResult = {
  imageDataUrl: string;
  width: number;
  height: number;
  extractedColors: string[];
  maskSummary: Record<ClientRecolorRole, number>;
  validation: PngValidationResult;
  validationStatus: PngValidationResult["status"];
  corrected: boolean;
  processingMs: number;
};

type Rgb = [number, number, number];
type Hsl = [number, number, number];

const roleCodes: Record<ClientRecolorRole, number> = {
  transparent: 0,
  primary: 1,
  secondary: 2,
  accent: 3,
  supporting: 4,
  neutral: 5,
  darkOutline: 6,
  lightOutline: 7,
  preserve: 8
};

const codeRoles: ClientRecolorRole[] = [
  "transparent",
  "primary",
  "secondary",
  "accent",
  "supporting",
  "neutral",
  "darkOutline",
  "lightOutline",
  "preserve"
];

const paletteRoles: PaletteRole[] = ["primary", "secondary", "accent", "supporting", "neutral"];

export function paletteColorsToClientRoleMap(palette: PaletteColor[], fallback: PaletteRoleMap): PaletteRoleMap {
  return {
    primary: palette.find((color) => color.role === "primary")?.hex ?? fallback.primary,
    secondary: palette.find((color) => color.role === "secondary")?.hex ?? fallback.secondary,
    accent: palette.find((color) => color.role === "accent")?.hex ?? fallback.accent,
    supporting: palette.find((color) => color.role === "supporting")?.hex ?? fallback.supporting,
    neutral: palette.find((color) => color.role === "neutral")?.hex ?? fallback.neutral
  };
}

export async function createClientRecolorSource(
  imageDataUrl: string,
  sourcePalette: PaletteRoleMap,
  options: { maxDimension?: number } = {}
): Promise<ClientRecolorSource> {
  const image = await loadImage(imageDataUrl);
  const scale = getScale(image.naturalWidth, image.naturalHeight, options.maxDimension);
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = get2dContext(canvas);
  context.clearRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  const imageData = context.getImageData(0, 0, width, height);
  const analysis = analyzeImageRoles(imageData, sourcePalette);

  return {
    imageData,
    masks: analysis.masks,
    width,
    height,
    sourcePalette,
    sourceRoleHsl: paletteToHsl(sourcePalette),
    extractedColors: analysis.extractedColors,
    maskSummary: analysis.maskSummary
  };
}

export function renderClientRecolorPreview(
  source: ClientRecolorSource,
  targetPalette: PaletteRoleMap,
  options: ClientRecolorOptions = {}
): ClientRecolorResult {
  const startedAt = performance.now();
  const output = new ImageData(new Uint8ClampedArray(source.imageData.data), source.width, source.height);
  recolorImageData(output, source, targetPalette, options);
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  get2dContext(canvas).putImageData(output, 0, 0);
  const validation = validateImageDataTransparency(output);

  return {
    imageDataUrl: canvas.toDataURL("image/png"),
    width: source.width,
    height: source.height,
    extractedColors: source.extractedColors,
    maskSummary: source.maskSummary,
    validation,
    validationStatus: validation.status,
    corrected: validation.corrected,
    processingMs: performance.now() - startedAt
  };
}

export async function recolorDataUrlAtOriginalResolution({
  imageDataUrl,
  sourcePalette,
  targetPalette,
  options
}: {
  imageDataUrl: string;
  sourcePalette: PaletteRoleMap;
  targetPalette: PaletteRoleMap;
  options?: ClientRecolorOptions;
}) {
  const source = await createClientRecolorSource(imageDataUrl, sourcePalette);
  return renderClientRecolorPreview(source, targetPalette, options);
}

function analyzeImageRoles(imageData: ImageData, sourcePalette: PaletteRoleMap) {
  const data = imageData.data;
  const masks = new Uint8Array(imageData.width * imageData.height);
  const paletteRgb = paletteToRgb(sourcePalette);
  const paletteHsl = paletteToHsl(sourcePalette);
  const buckets = new Map<string, number>();
  const maskSummary = createMaskSummary();

  for (let pixel = 0, index = 0; index < data.length; pixel += 1, index += 4) {
    const alpha = data[index + 3];

    if (alpha <= 8) {
      masks[pixel] = roleCodes.transparent;
      maskSummary.transparent += 1;
      continue;
    }

    const rgb: Rgb = [data[index], data[index + 1], data[index + 2]];
    const hsl = rgbToHsl(rgb);
    const role = classifyPixel(rgb, hsl, paletteRgb, paletteHsl);
    masks[pixel] = roleCodes[role];
    maskSummary[role] += 1;

    if (alpha > 160 && role !== "transparent") {
      const bucket = quantizedHex(rgb);
      buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
    }
  }

  return {
    masks,
    extractedColors: [...buckets.entries()]
      .sort((first, second) => second[1] - first[1])
      .slice(0, 8)
      .map(([hex]) => hex),
    maskSummary
  };
}

function recolorImageData(
  output: ImageData,
  source: ClientRecolorSource,
  targetPalette: PaletteRoleMap,
  options: ClientRecolorOptions
) {
  const data = output.data;
  const targetRgb = paletteToRgb(targetPalette);
  const targetHsl = paletteToHsl(targetPalette);
  const outlineRgb = hexToRgb(options.outlineColor ?? source.sourcePalette.neutral) ?? targetRgb.neutral;
  const outlineHsl = rgbToHsl(outlineRgb);

  for (let pixel = 0, index = 0; index < data.length; pixel += 1, index += 4) {
    const role = codeRoles[source.masks[pixel]] ?? "preserve";

    if (role === "transparent" || role === "preserve") {
      continue;
    }

    if (role === "darkOutline" || role === "lightOutline") {
      if (!options.outlineColors) {
        continue;
      }
      const rgb = recolorPixel([data[index], data[index + 1], data[index + 2]], outlineHsl, undefined, role);
      data[index] = rgb[0];
      data[index + 1] = rgb[1];
      data[index + 2] = rgb[2];
      continue;
    }

    const rgb = recolorPixel(
      [data[index], data[index + 1], data[index + 2]],
      targetHsl[role],
      source.sourceRoleHsl[role],
      role
    );
    data[index] = rgb[0];
    data[index + 1] = rgb[1];
    data[index + 2] = rgb[2];
  }
}

function classifyPixel(
  rgb: Rgb,
  hsl: Hsl,
  paletteRgb: Record<PaletteRole, Rgb>,
  paletteHsl: Record<PaletteRole, Hsl>
): ClientRecolorRole {
  const nearest = nearestPaletteRole(rgb, hsl, paletteRgb, paletteHsl);
  const [red, green, blue] = rgb;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const chroma = max - min;
  const [, saturation, lightness] = hsl;
  const nearlyNeutral = saturation < 0.16 || chroma < 24;

  if (lightness <= 0.2 && nearlyNeutral) {
    return "darkOutline";
  }

  if (lightness >= 0.84 && nearlyNeutral) {
    return "lightOutline";
  }

  if (nearest.score < 0.29 || (nearest.hueScore < 0.1 && saturation > 0.2)) {
    return nearest.role;
  }

  if (max < 54 && nearlyNeutral) {
    return "darkOutline";
  }

  if (nearest.score < 0.42) {
    return nearest.role;
  }

  return "preserve";
}

function nearestPaletteRole(
  rgb: Rgb,
  hsl: Hsl,
  paletteRgb: Record<PaletteRole, Rgb>,
  paletteHsl: Record<PaletteRole, Hsl>
) {
  return paletteRoles
    .map((role) => {
      const rgbScore = colorDistance(rgb, paletteRgb[role]) / 441.68;
      const hueScore = hsl[1] < 0.12 ? 0.5 : hueDistance(hsl[0], paletteHsl[role][0]);
      const lightnessScore = Math.abs(hsl[2] - paletteHsl[role][2]);
      const saturationScore = Math.abs(hsl[1] - paletteHsl[role][1]) * 0.35;

      return {
        role,
        score: rgbScore * 0.52 + hueScore * 0.32 + lightnessScore * 0.12 + saturationScore,
        hueScore
      };
    })
    .sort((first, second) => first.score - second.score)[0];
}

function recolorPixel(sourceRgb: Rgb, targetHsl: Hsl, sourceRoleHsl?: Hsl, role?: ClientRecolorRole): Rgb {
  const sourceHsl = rgbToHsl(sourceRgb);
  const baseLightness = sourceRoleHsl?.[2] ?? (role === "lightOutline" ? 0.9 : 0.12);
  const lightnessDelta = sourceHsl[2] - baseLightness;
  const lightness = clamp01(targetHsl[2] + lightnessDelta * 0.9);
  const saturation = clamp01(targetHsl[1] * 0.88 + sourceHsl[1] * 0.12);

  return hslToRgb([targetHsl[0], saturation, lightness]);
}

function validateImageDataTransparency(imageData: ImageData): PngValidationResult {
  let transparent = 0;
  let hasPartialAlpha = false;
  const total = imageData.width * imageData.height;
  const data = imageData.data;

  for (let index = 3; index < data.length; index += 4) {
    const alpha = data[index];
    if (alpha === 0) {
      transparent += 1;
    }
    if (alpha < 255) {
      hasPartialAlpha = true;
    }
  }

  const transparentPixelRatio = total === 0 ? 0 : transparent / total;

  return {
    status: transparentPixelRatio >= 0.01 ? "VALID_TRANSPARENT_PNG" : "LOW_TRANSPARENCY",
    hasAlphaChannel: hasPartialAlpha,
    transparentPixelRatio,
    checkerboardDetected: false,
    corrected: true,
    message:
      transparentPixelRatio >= 0.01
        ? undefined
        : "클라이언트 색상 변경 결과의 투명 픽셀 비율이 낮습니다."
  };
}

function createMaskSummary(): Record<ClientRecolorRole, number> {
  return {
    transparent: 0,
    primary: 0,
    secondary: 0,
    accent: 0,
    supporting: 0,
    neutral: 0,
    darkOutline: 0,
    lightOutline: 0,
    preserve: 0
  };
}

function getScale(width: number, height: number, maxDimension?: number) {
  if (!maxDimension) {
    return 1;
  }

  return Math.min(1, maxDimension / Math.max(width, height));
}

function loadImage(imageDataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("색상 변경할 PNG 이미지를 불러오지 못했습니다."));
    image.src = imageDataUrl;
  });
}

function get2dContext(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("Canvas 2D 컨텍스트를 만들 수 없습니다.");
  }

  return context;
}

function paletteToRgb(palette: PaletteRoleMap): Record<PaletteRole, Rgb> {
  return {
    primary: hexToRgb(palette.primary) ?? [0, 0, 0],
    secondary: hexToRgb(palette.secondary) ?? [0, 0, 0],
    accent: hexToRgb(palette.accent) ?? [0, 0, 0],
    supporting: hexToRgb(palette.supporting) ?? [0, 0, 0],
    neutral: hexToRgb(palette.neutral) ?? [0, 0, 0]
  };
}

function paletteToHsl(palette: PaletteRoleMap): Record<PaletteRole, Hsl> {
  const rgb = paletteToRgb(palette);

  return {
    primary: rgbToHsl(rgb.primary),
    secondary: rgbToHsl(rgb.secondary),
    accent: rgbToHsl(rgb.accent),
    supporting: rgbToHsl(rgb.supporting),
    neutral: rgbToHsl(rgb.neutral)
  };
}

function hexToRgb(hex: string): Rgb | undefined {
  const normalized = hex.trim().replace(/^#/, "");

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return undefined;
  }

  const value = Number.parseInt(normalized, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgbToHsl([red, green, blue]: Rgb): Hsl {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;

  if (max === min) {
    return [0, 0, lightness];
  }

  const delta = max - min;
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue = 0;

  if (max === r) {
    hue = (g - b) / delta + (g < b ? 6 : 0);
  } else if (max === g) {
    hue = (b - r) / delta + 2;
  } else {
    hue = (r - g) / delta + 4;
  }

  return [hue / 6, saturation, lightness];
}

function hslToRgb([hue, saturation, lightness]: Hsl): Rgb {
  if (saturation === 0) {
    const value = Math.round(lightness * 255);
    return [value, value, value];
  }

  const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;
  const values = [hue + 1 / 3, hue, hue - 1 / 3].map((channelHue) => {
    let t = channelHue;
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  });

  return values.map((value) => Math.round(clamp01(value) * 255)) as Rgb;
}

function colorDistance(first: Rgb, second: Rgb) {
  return Math.sqrt(
    (first[0] - second[0]) ** 2 +
      (first[1] - second[1]) ** 2 +
      (first[2] - second[2]) ** 2
  );
}

function hueDistance(first: number, second: number) {
  const distance = Math.abs(first - second);
  return Math.min(distance, 1 - distance);
}

function quantizedHex([red, green, blue]: Rgb) {
  const quantized: Rgb = [
    Math.round(red / 24) * 24,
    Math.round(green / 24) * 24,
    Math.round(blue / 24) * 24
  ];

  return `#${quantized.map((value) => clamp255(value).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function clamp255(value: number) {
  return Math.min(255, Math.max(0, Math.round(value)));
}
