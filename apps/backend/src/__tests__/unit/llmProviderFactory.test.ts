const envMock: Record<string, string | undefined> = {};
const resolveProviderConfig = jest.fn();
jest.mock("../../config/env", () => ({ env: envMock }));
jest.mock("../../modules/ai-settings/aiSettings.service", () => ({ resolveProviderConfig: (p: unknown) => resolveProviderConfig(p) }));

import { getLlmProvider, getLlmProviderInfo } from "../../modules/llm/llmProvider.factory";
import { AnthropicProvider } from "../../modules/llm/anthropicProvider";
import { GeminiProvider } from "../../modules/llm/geminiProvider";
import { GroqProvider } from "../../modules/llm/groqProvider";
import { OpenAiProvider } from "../../modules/llm/openAiProvider";

const prisma = {} as never;

beforeEach(() => {
  for (const k of Object.keys(envMock)) delete envMock[k];
  Object.assign(envMock, {
    OPENAI_MODEL: "gpt-x",
    ANTHROPIC_MODEL: "claude-x",
    GROQ_MODEL: "groq-x",
    GEMINI_MODEL: "gemini-x",
  });
  resolveProviderConfig.mockReset().mockResolvedValue(null);
});

describe("getLlmProvider", () => {
  it("prefers the tenant's own configuration over env", async () => {
    envMock.LLM_PROVIDER = "openai";
    envMock.OPENAI_API_KEY = "env-key";
    resolveProviderConfig.mockResolvedValue({ provider: "GEMINI", apiKey: "tenant-key", model: "m" });
    await expect(getLlmProvider(prisma)).resolves.toBeInstanceOf(GeminiProvider);

    resolveProviderConfig.mockResolvedValue({ provider: "GROQ", apiKey: "tenant-key", model: "m" });
    await expect(getLlmProvider(prisma)).resolves.toBeInstanceOf(GroqProvider);
  });

  it.each([
    ["anthropic", "ANTHROPIC_API_KEY", AnthropicProvider],
    ["gemini", "GEMINI_API_KEY", GeminiProvider],
    ["openai", "OPENAI_API_KEY", OpenAiProvider],
    ["groq", "GROQ_API_KEY", GroqProvider],
  ])("falls back to the env %s provider when configured", async (name, keyVar, Ctor) => {
    envMock.LLM_PROVIDER = name;
    envMock[keyVar] = "k";
    await expect(getLlmProvider(prisma)).resolves.toBeInstanceOf(Ctor);
  });

  it.each([
    ["anthropic", "ANTHROPIC_API_KEY"],
    ["gemini", "GEMINI_API_KEY"],
    ["openai", "OPENAI_API_KEY"],
    ["groq", "GROQ_API_KEY"],
  ])("throws 502 LLM_NOT_CONFIGURED for %s without a key", async (name, keyVar) => {
    envMock.LLM_PROVIDER = name;
    await expect(getLlmProvider(prisma)).rejects.toMatchObject({ status: 502, code: "LLM_NOT_CONFIGURED", message: `${keyVar} is not configured` });
  });

  it("defaults to groq for an unrecognized provider", async () => {
    envMock.LLM_PROVIDER = "mystery";
    envMock.GROQ_API_KEY = "k";
    await expect(getLlmProvider(prisma)).resolves.toBeInstanceOf(GroqProvider);
  });
});

describe("getLlmProviderInfo", () => {
  it("reports the tenant's provider (lower-cased) and model", async () => {
    resolveProviderConfig.mockResolvedValue({ provider: "GEMINI", apiKey: "k", model: "gemini-pro" });
    await expect(getLlmProviderInfo(prisma)).resolves.toEqual({ provider: "gemini", model: "gemini-pro" });
  });

  it.each([
    ["anthropic", "claude-x"],
    ["gemini", "gemini-x"],
    ["openai", "gpt-x"],
    ["groq", "groq-x"],
    ["whatever", "groq-x"],
  ])("reports env provider %s -> model %s", async (name, model) => {
    envMock.LLM_PROVIDER = name;
    const info = await getLlmProviderInfo(prisma);
    expect(info.model).toBe(model);
    expect(info.provider).toBe(name === "whatever" ? "groq" : name);
  });

  it("does not require an API key (info only, no provider is built)", async () => {
    envMock.LLM_PROVIDER = "openai";
    await expect(getLlmProviderInfo(prisma)).resolves.toEqual({ provider: "openai", model: "gpt-x" });
  });
});
