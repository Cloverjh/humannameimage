export const OPENAI_MODELS = {
  image: "gpt-image-2",
  imageEdit: "gpt-image-2",
  analysis: "gpt-5.6-terra"
} as const;

export function getImageGenerationModel() {
  return process.env.OPENAI_IMAGE_MODEL || OPENAI_MODELS.image;
}

export function getImageEditModel() {
  return process.env.OPENAI_IMAGE_EDIT_MODEL || process.env.OPENAI_IMAGE_MODEL || OPENAI_MODELS.imageEdit;
}

export function getAnalysisModel() {
  return process.env.OPENAI_TEXT_MODEL || OPENAI_MODELS.analysis;
}
