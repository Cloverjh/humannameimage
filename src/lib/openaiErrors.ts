export function getOpenAIErrorMessage(data: unknown, fallback: string) {
  const message = (data as { error?: { message?: string; code?: string; type?: string } }).error?.message;
  const code = (data as { error?: { code?: string } }).error?.code;
  const rawMessage = message ?? fallback;

  return normalizeOpenAIError(rawMessage, code, fallback);
}

export function getOpenAIErrorForUser(error: unknown, fallback: string) {
  const code =
    typeof error === "object" && error !== null && "code" in error && typeof error.code === "string" ? error.code : undefined;
  const status =
    typeof error === "object" && error !== null && "status" in error && typeof error.status === "number"
      ? error.status
      : undefined;
  const message = error instanceof Error ? error.message : fallback;

  return normalizeOpenAIError(message, code, fallback, status);
}

export function normalizeOpenAIError(message: string, code?: string, fallback = "OpenAI API 요청에 실패했습니다.", status?: number) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("openai_api_key_missing")) {
    return "OPENAI_API_KEY_MISSING: OPENAI_API_KEY를 설정해야 생성 기능을 사용할 수 있습니다.";
  }

  if (
    code === "insufficient_quota" ||
    lowerMessage.includes("exceeded your current quota") ||
    lowerMessage.includes("check your plan and billing")
  ) {
    return [
      "OpenAI API 사용 한도 또는 결제 크레딧이 부족합니다.",
      "프롬프트 분석은 로컬 규칙 기반으로 계속 볼 수 있지만, 실제 이미지 생성은 OpenAI 결제/한도 문제가 해결된 뒤 가능합니다.",
      "OpenAI Platform의 Usage, Limits, Billing 설정에서 남은 크레딧과 프로젝트 예산을 확인해 주세요."
    ].join(" ");
  }

  if (
    code === "model_not_found" ||
    lowerMessage.includes("model_not_found") ||
    lowerMessage.includes("does not exist") ||
    lowerMessage.includes("model") && lowerMessage.includes("not available")
  ) {
    return "MODEL_NOT_AVAILABLE: 현재 프로젝트에서 요청한 OpenAI 모델을 사용할 수 없습니다. 모델 권한과 프로젝트 설정을 확인해 주세요.";
  }

  if (lowerMessage.includes("incorrect api key") || lowerMessage.includes("invalid api key")) {
    return "OpenAI API Key가 올바르지 않습니다. .env.local의 OPENAI_API_KEY 값에 오타나 앞뒤 공백이 없는지 확인해 주세요.";
  }

  if (
    code === "invalid_request_error" ||
    status === 400 ||
    lowerMessage.includes("unsupported") ||
    lowerMessage.includes("invalid") ||
    lowerMessage.includes("background") ||
    lowerMessage.includes("parameter")
  ) {
    return "INVALID_IMAGE_PARAMETER: 이미지 생성 파라미터가 현재 모델 또는 계정에서 지원되지 않습니다. 잠시 후 다시 시도하거나 관리자에게 알려 주세요.";
  }

  if (status === 429 || lowerMessage.includes("rate limit")) {
    return "RATE_LIMITED: OpenAI API 요청 속도 제한에 걸렸습니다. 잠시 후 다시 시도해 주세요.";
  }

  return fallback;
}
