import { getOpenAIClient } from "@/lib/openaiClient";
import { getOpenAIErrorDetails, getOpenAIErrorForUser, isRetryableOpenAIError, type OpenAIErrorDetails } from "@/lib/openaiErrors";
import { getImageEditModel, getImageGenerationModel } from "@/lib/openai-models";
import { dataUrlToBuffer } from "@/lib/serverImageProcessing";
import sharp from "sharp";
import type { OutputType } from "@/lib/generativeTypes";
import type { ImageEditParamsNonStreaming, ImageGenerateParamsNonStreaming, ImagesResponse } from "openai/resources/images";

export type OpenAIImageResponse = ImagesResponse;
export type OpenAIImageEndpoint = "images.generate" | "images.edit";

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

export class OpenAIImageApiError extends Error {
  endpoint: OpenAIImageEndpoint;
  details: OpenAIErrorDetails;
  retryable: boolean;

  constructor(endpoint: OpenAIImageEndpoint, message: string, details: OpenAIErrorDetails) {
    super(message);
    this.name = "OpenAIImageApiError";
    this.endpoint = endpoint;
    this.details = details;
    this.retryable = isRetryableOpenAIError(details);
  }
}

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
  const background = transparentRequested && supportsTransparentBackground(model) ? "transparent" : "auto";
  const outputFormat = "png";
  const quality = "high";
  const requestBody: ImageGenerateParamsNonStreaming = {
    model,
    prompt: apiPrompt,
    n: 1,
    size: apiSize,
    quality,
    output_format: outputFormat,
    stream: false,
    background
  };

  logOpenAIImageRequest({
    endpoint: "images.generate",
    model,
    quality,
    background,
    output_format: outputFormat,
    requestedSize: apiSize
  });

  try {
    return await getOpenAIClient().images.generate(requestBody);
  } catch (error) {
    throw createOpenAIImageApiError("images.generate", error, "IMAGE_GENERATION_FAILED: 이미지 생성 요청에 실패했습니다.");
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
  const sourceImageSize = await getImageSize(source.buffer);
  const background = transparentRequested && supportsTransparentBackground(model) ? "transparent" : "auto";
  const outputFormat = "png";
  const quality = "high";
  const requestBody: ImageEditParamsNonStreaming = {
    model,
    prompt: apiPrompt,
    n: 1,
    size: apiSize,
    quality,
    output_format: outputFormat,
    stream: false,
    background,
    image: new File([source.buffer], fileName, { type: source.mimeType })
  };

  logOpenAIImageRequest({
    endpoint: "images.edit",
    model,
    quality,
    background,
    output_format: outputFormat,
    requestedSize: apiSize,
    sourceImageMimeType: source.mimeType,
    sourceImageBytes: source.buffer.byteLength,
    sourceImageSize,
    input_fidelity: "omitted"
  });

  try {
    return await getOpenAIClient().images.edit(requestBody);
  } catch (error) {
    throw createOpenAIImageApiError("images.edit", error, "IMAGE_EDIT_FAILED: 이미지 편집 요청에 실패했습니다.");
  }
}

function createOpenAIImageApiError(endpoint: OpenAIImageEndpoint, error: unknown, fallback: string) {
  const details = getOpenAIErrorDetails(error);
  console.error("OpenAI image API failed", {
    endpoint,
    status: details.status,
    code: details.code,
    param: details.param,
    type: details.type,
    message: details.message
  });

  return new OpenAIImageApiError(endpoint, getOpenAIErrorForUser(error, fallback), details);
}

function logOpenAIImageRequest(payload: {
  endpoint: OpenAIImageEndpoint;
  model: string;
  quality: string;
  background: string;
  output_format: string;
  requestedSize: string;
  sourceImageMimeType?: string;
  sourceImageBytes?: number;
  sourceImageSize?: { width?: number; height?: number; format?: string };
  input_fidelity?: "omitted";
}) {
  console.log("OpenAI image API request", payload);
}

async function getImageSize(buffer: Buffer) {
  try {
    const metadata = await sharp(buffer).metadata();

    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format
    };
  } catch {
    return undefined;
  }
}
