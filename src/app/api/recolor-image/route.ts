import { NextResponse } from "next/server";
import { requireAuthenticated } from "@/lib/auth";
import { getOpenAIImageSize, parseImageSize } from "@/lib/generativeOptions";
import { chooseImageModel, requestImageEdit } from "@/lib/openaiImageApi";
import { prepareServerPng, recolorTransparentPng } from "@/lib/serverImageProcessing";
import type {
  ImageSize,
  OutputType,
  PaletteColor,
  PaletteRoleMap,
  RecolorMetadata
} from "@/lib/generativeTypes";

export const runtime = "nodejs";
export const maxDuration = 120;

type RequestBody = {
  imageDataUrl?: string;
  currentPalette?: PaletteColor[];
  targetPalette?: PaletteRoleMap;
  assetType?: OutputType | "actual-icon" | "recommended-icon";
  version?: number;
  baseVersion?: number;
  sourceImageId?: string;
  size?: ImageSize;
  title?: string;
  lineBreakPlan?: string;
  allowImageEditFallback?: boolean;
  options?: RecolorMetadata["options"];
};

export async function POST(request: Request) {
  if (!(await requireAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = performance.now();

  try {
    const body = (await request.json()) as RequestBody;

    if (!body.imageDataUrl || !body.currentPalette || !body.targetPalette || !body.assetType) {
      return NextResponse.json({ error: "색상 변경에 필요한 이미지와 팔레트 정보가 부족합니다." }, { status: 400 });
    }

    const processed = await recolorTransparentPng({
      imageDataUrl: body.imageDataUrl,
      currentPalette: body.currentPalette,
      targetPalette: body.targetPalette
    });

    if (processed.validationStatus !== "VALID_TRANSPARENT_PNG" && canUseImageEditFallback(body)) {
      const fallback = await recolorWithImageEditFallback(body);
      const fallbackSize = body.size ? parseImageSize(body.size) : processed;

      if (fallback.validationStatus === "VALID_TRANSPARENT_PNG") {
        return NextResponse.json({
          recolored: {
            imageDataUrl: fallback.imageDataUrl,
            width: fallbackSize.width,
            height: fallbackSize.height,
            validation: fallback.validation,
            validationStatus: fallback.validationStatus,
            corrected: fallback.corrected,
            recolor: createRecolorMetadata(body, "image-edit", processed.extractedColors),
            timings: {
              processingMs: fallback.resizeMs,
              totalMs: performance.now() - startedAt
            }
          }
        });
      }
    }

    if (processed.validationStatus !== "VALID_TRANSPARENT_PNG") {
      return NextResponse.json(
        {
          error: processed.validation.message ?? "색상 변경 후 투명 PNG 검증에 실패했습니다.",
          status: processed.validationStatus,
          validation: processed.validation
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      recolored: {
        imageDataUrl: processed.imageDataUrl,
        width: processed.width,
        height: processed.height,
        validation: processed.validation,
        validationStatus: processed.validationStatus,
        corrected: processed.corrected,
        recolor: createRecolorMetadata(body, "server-recolor", processed.extractedColors),
        timings: {
          processingMs: processed.processingMs,
          totalMs: performance.now() - startedAt
        }
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "색상 변경 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

function canUseImageEditFallback(body: RequestBody) {
  return (
    body.allowImageEditFallback === true &&
    body.assetType === "decorated-title" &&
    Boolean(body.size) &&
    Boolean(body.targetPalette) &&
    Boolean(body.imageDataUrl) &&
    Boolean(process.env.OPENAI_API_KEY)
  );
}

async function recolorWithImageEditFallback(body: RequestBody) {
  if (!body.imageDataUrl || !body.targetPalette || !body.size) {
    throw new Error("이미지 편집 fallback에 필요한 정보가 부족합니다.");
  }

  const model = chooseImageModel("decorated-title");
  const response = await requestImageEdit({
    apiPrompt: buildEditFallbackPrompt(body),
    apiSize: getOpenAIImageSize(body.size),
    inputImageDataUrl: body.imageDataUrl,
    model,
    transparentRequested: true,
    fileName: "selected-decorated-title-recolor-reference.png"
  });
  const first = response.data?.[0];
  const b64 = first?.b64_json;

  if (!b64) {
    throw new Error("OpenAI 이미지 편집 응답에 이미지 데이터가 없습니다.");
  }

  return prepareServerPng(b64, body.size, { punchOutInteriorLight: true });
}

function buildEditFallbackPrompt(body: RequestBody) {
  const palette = body.targetPalette as PaletteRoleMap;

  return [
    "Use the selected decorated Korean title image as the master layout reference.",
    "Preserve exactly: title wording, Korean line breaks, line count, title position, alignment, icon positions, decorative arrangement, and overall layout.",
    "Change only the color system.",
    `Title: ${body.title ?? ""}`,
    `Line breaks: ${body.lineBreakPlan ?? "preserve exactly as input"}`,
    "New palette:",
    `- Primary: ${palette.primary}`,
    `- Secondary: ${palette.secondary}`,
    `- Accent: ${palette.accent}`,
    `- Supporting: ${palette.supporting}`,
    `- Neutral: ${palette.neutral}`,
    "Do not create a new layout.",
    "Do not change the title wording.",
    "Do not change icon positions.",
    "Do not change line breaks.",
    "Only recolor the design while preserving the original structure.",
    "Return a true transparent PNG with real alpha transparency. No checkerboard, no white background, no gray background."
  ].join("\n");
}

function createRecolorMetadata(
  body: RequestBody,
  method: RecolorMetadata["method"],
  extractedColors: string[]
): RecolorMetadata {
  if (!body.targetPalette) {
    throw new Error("색상 변경 팔레트가 없습니다.");
  }

  return {
    version: body.version ?? 2,
    baseVersion: body.baseVersion ?? 1,
    palette: body.targetPalette,
    preservedLayout: true,
    preservedLineBreaks: true,
    method,
    createdAt: new Date().toISOString(),
    sourceImageId: body.sourceImageId,
    options: body.options,
    extractedColors
  };
}
