import { NextResponse } from "next/server";
import { requireAuthenticated } from "@/lib/auth";
import { createDesignDirectionsWithOpenAI } from "@/lib/designDirector";
import { buildCandidatePromptSets } from "@/lib/promptBuilder";
import type { CandidateId, EducationImageForm } from "@/lib/generativeTypes";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!(await requireAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = (await request.json()) as EducationImageForm;
    const hasDesignLock = hasCompleteDesignDNAOverrides(form);

    if (hasDesignLock || !process.env.OPENAI_API_KEY) {
      const candidateSet = buildCandidatePromptSets(form);
      return NextResponse.json({
        candidateSet,
        warning: !process.env.OPENAI_API_KEY
          ? "OPENAI_API_KEY가 없어 로컬 Design DNA 엔진으로 시안을 구성했습니다."
          : undefined
      });
    }

    try {
      const director = await createDesignDirectionsWithOpenAI(form);
      const candidateSet = buildCandidatePromptSets(form, director);
      return NextResponse.json({ candidateSet, designDirectorModel: director.model });
    } catch (error) {
      console.error("AI design director failed; using local Design DNA fallback", error);
      const candidateSet = buildCandidatePromptSets(form);
      return NextResponse.json({
        candidateSet,
        warning: "AI 디자인 분석에 실패해 로컬 Design DNA 다양화 엔진을 사용했습니다."
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "제목 시안 프롬프트 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

function hasCompleteDesignDNAOverrides(form: EducationImageForm) {
  const ids: CandidateId[] = ["option-1", "option-2"];
  return ids.every((candidateId) => Boolean(form.designDNAOverrides?.[candidateId]));
}
