import { MiraAIInput } from "../miraAIProcessing";

export default function fallbackTemplate(input: MiraAIInput): string {
  // Fallback templates should not exist - AI processing should never fail to the point of needing hardcoded responses
  throw new Error("Fallback processing disabled - AI must handle all content generation");
}