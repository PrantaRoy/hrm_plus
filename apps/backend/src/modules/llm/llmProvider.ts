export interface LlmJsonRequest {
  system: string;
  prompt: string;
  maxTokens?: number;
}

export interface LlmProvider {
  generateJson<T>(request: LlmJsonRequest): Promise<T>;
}
