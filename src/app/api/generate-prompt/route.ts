import { NextResponse } from "next/server";
import { requireAuthenticated } from "@/lib/auth";
import { getAnalysisModel } from "@/lib/openai-models";
import { getOpenAIClient } from "@/lib/openaiClient";
import { getOpenAIErrorForUser, normalizeOpenAIError } from "@/lib/openaiErrors";
import { buildPromptLocally } from "@/lib/promptBuilder";
import type { EducationImageForm, GeneratedPrompt } from "@/lib/generativeTypes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await requireAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = (await request.json()) as EducationImageForm;
    const localPrompt = buildPromptLocally(form);

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        prompt: localPrompt,
        warning: "OPENAI_API_KEY가 없어 로컬 규칙 기반 프롬프트를 만들었습니다."
      });
    }

    try {
      const prompt = await createPromptWithOpenAI(form, localPrompt);
      return NextResponse.json({ prompt });
    } catch (error) {
      return NextResponse.json({
        prompt: localPrompt,
        warning: `OpenAI 프롬프트 생성에 실패해 로컬 규칙 기반 프롬프트를 사용했습니다. ${
          error instanceof Error ? normalizeOpenAIError(error.message) : ""
        }`
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "프롬프트 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

async function createPromptWithOpenAI(form: EducationImageForm, localPrompt: GeneratedPrompt): Promise<GeneratedPrompt> {
  const model = getAnalysisModel();

  try {
    const response = await getOpenAIClient().responses.create({
      model,
      instructions:
        "You are an art director for Korean social-impact education promotion. Preserve the local designSpec exactly. Return only valid JSON. Do not change the output type, title text, color palette, line break plan, decoration list, or layer separation rules.",
      input: JSON.stringify({
        task: "Refine the image generation prompt without changing the locked designSpec.",
        requiredShape: {
          analysis: {
            coreEmotion: "string in Korean",
            keywords: ["short strings"],
            visualMetaphor: "string",
            recommendedColors: ["color names and hex codes"],
            avoid: ["strings"],
            titlePlacement: "string",
            typographyStyle: "string",
            aspectRatio: "string",
            transparentBackground: "boolean",
            designSpecId: "string"
          },
          prompt: "English image generation prompt preserving the localDraft designSpec and output-specific layer rules.",
          negativePrompt: "comma-separated avoid list",
          palette: [
            {
              name: "string",
              hex: "#RRGGBB",
              usage: "string in Korean",
              role: "primary | secondary | accent | supporting | neutral"
            },
          ]
        },
        localDraft: localPrompt,
        form
      }),
      text: {
        format: { type: "json_object" },
        verbosity: "low"
      },
      store: false
    });

    if (!response.output_text) {
      throw new Error("OpenAI 응답에서 프롬프트 텍스트를 찾지 못했습니다.");
    }

    const parsed = parseJsonFromText(response.output_text);

    return {
      ...localPrompt,
      ...parsed,
      analysis: {
        ...localPrompt.analysis,
        ...(parsed.analysis ?? {})
      },
      palette: parsed.palette ?? localPrompt.palette,
      outputType: form.outputType,
      textMode: form.textMode,
      size: form.size,
      quality: form.quality,
      designSpec: localPrompt.designSpec,
      model,
      usedFallback: false
    };
  } catch (error) {
    console.error("OpenAI prompt generation failed", error);
    throw new Error(getOpenAIErrorForUser(error, "OpenAI 프롬프트 생성 API 요청에 실패했습니다."));
  }
}

function parseJsonFromText(text: string) {
  const trimmed = text.trim();
  const json = trimmed.startsWith("{") ? trimmed : trimmed.match(/\{[\s\S]*\}/)?.[0];

  if (!json) {
    throw new Error("OpenAI가 JSON 형식의 프롬프트를 반환하지 않았습니다.");
  }

  return JSON.parse(json);
}
