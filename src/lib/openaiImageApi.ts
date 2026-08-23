import { getOpenAIClient } from "@/lib/openaiClient";
import { getOpenAIErrorForUser } from "@/lib/openaiErrors";
import { getImageEditModel, getImageGenerationModel } from "@/lib/openai-models";
import { dataUrlToBuffer } from "@/lib/serverImageProcessing";
import type { OutputType } from "@/lib/generativeTypes";
import type { ImageEditParamsNonStreaming, ImageGenerateParamsNonStreaming, ImagesResponse } from "openai/resources/images";

export type OpenAIImageResponse = ImagesResponse;

type RequestImageGenerationOptions = {
  apiPrompt: string;
  apiSize: string;
  model: string;
  transparentRequested: boolean;
};

type RequestImageEditOptions = RequestImageGenerationOptions & {
  inputImageDataUrl: string;
  fileName?: string;
};

export function chooseImageModel(outputType?: OutputType | "recommended-icon" | "thumbnail-background") {
  if (outputType === "title-only" || outputType === "icons-only" || outputType === "recommended-icon") {
    return getImageEditModel();
  }

  return getImageGenerationModel();
}

export function supportsTransparentBackground(model: string) {
  return model.startsWith("gpt-image-");
}

export async function requestImageGeneration({
  apiPrompt,
  apiSize,
  model,
  transparentRequested
}: RequestImageGenerationOptions) {
  const requestBody: ImageGenerateParamsNonStreaming = {
    model,
    prompt: apiPrompt,
    n: 1,
    size: apiSize,
    quality: "high",
    output_format: "png",
    stream: false,
    background: transparentRequested && supportsTransparentBackground(model) ? "transparent" : "auto"
  };

  try {
    return await getOpenAIClient().images.generate(requestBody);
  } catch (error) {
    console.error("OpenAI image generation failed", error);
    throw new Error(getOpenAIErrorForUser(error, "IMAGE_GENERATION_FAILED: 이미지 생성 요청에 실패했습니다."));
  }
}

export async function requestImageEdit({
  apiPrompt,
  apiSize,
  inputImageDataUrl,
  model,
  transparentRequested,
  fileName = "selected-decorated-title.png"
}: RequestImageEditOptions) {
  const source = dataUrlToBuffer(inputImageDataUrl);
  const requestBody: ImageEditParamsNonStreaming = {
    model,
    prompt: apiPrompt,
    n: 1,
    size: apiSize,
    quality: "high",
    output_format: "png",
    input_fidelity: "high",
    stream: false,
    background: transparentRequested && supportsTransparentBackground(model) ? "transparent" : "auto",
    image: new File([source.buffer], fileName, { type: source.mimeType })
  };

  try {
    return await getOpenAIClient().images.edit(requestBody);
  } catch (error) {
    console.error("OpenAI image edit failed", error);
    throw new Error(getOpenAIErrorForUser(error, "IMAGE_EDIT_FAILED: 이미지 편집 요청에 실패했습니다."));
  }
}
