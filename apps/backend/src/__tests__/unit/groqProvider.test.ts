import { GroqProvider } from "../../modules/llm/groqProvider";

const provider = new GroqProvider({ apiKey: "key-123", model: "test-model" });
const fetchMock = jest.fn();
const realFetch = global.fetch;

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});
afterAll(() => {
  global.fetch = realFetch;
});

const respond = (content: unknown, ok = true) =>
  fetchMock.mockResolvedValue({ ok, json: async () => (content === undefined ? {} : { choices: [{ message: { content } }] }) });

describe("GroqProvider.generateJson", () => {
  it("sends model, auth header and a JSON-only system prompt, honoring maxTokens", async () => {
    respond('{"a":1}');
    await provider.generateJson({ system: "Be brief.", prompt: "Hi", maxTokens: 321 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(init.headers.Authorization).toBe("Bearer key-123");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ model: "test-model", max_tokens: 321, messages: [{ role: "system" }, { role: "user", content: "Hi" }] });
    expect(body.messages[0].content).toContain("Be brief.");
    expect(body.messages[0].content).toContain("ONLY the JSON object");
  });

  it("defaults max_tokens to 1500", async () => {
    respond("{}");
    await provider.generateJson({ system: "s", prompt: "p" });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).max_tokens).toBe(1500);
  });

  it("parses bare JSON", async () => {
    respond('{"score": 7}');
    await expect(provider.generateJson({ system: "s", prompt: "p" })).resolves.toEqual({ score: 7 });
  });

  it("extracts the JSON object out of surrounding prose / code fences", async () => {
    respond('Sure! Here you go:\n```json\n{"score": 9, "nested": {"x": [1,2]}}\n```\nHope that helps.');
    await expect(provider.generateJson({ system: "s", prompt: "p" })).resolves.toEqual({ score: 9, nested: { x: [1, 2] } });
  });

  it("maps a network failure to 502 LLM_ERROR", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNRESET"));
    await expect(provider.generateJson({ system: "s", prompt: "p" })).rejects.toMatchObject({ status: 502, code: "LLM_ERROR" });
  });

  it("maps a non-2xx response to 502 LLM_ERROR without leaking the upstream body", async () => {
    respond("ignored", false);
    await expect(provider.generateJson({ system: "s", prompt: "p" })).rejects.toMatchObject({ status: 502, message: "AI provider request failed" });
  });

  it("maps empty content / missing choices to an empty-response error", async () => {
    respond("");
    await expect(provider.generateJson({ system: "s", prompt: "p" })).rejects.toMatchObject({ message: "AI provider returned an empty response" });
    respond(undefined);
    await expect(provider.generateJson({ system: "s", prompt: "p" })).rejects.toMatchObject({ message: "AI provider returned an empty response" });
  });

  it("maps non-JSON content to an unparseable-response error", async () => {
    respond("I cannot help with that.");
    await expect(provider.generateJson({ system: "s", prompt: "p" })).rejects.toMatchObject({ message: "AI provider returned an unparseable response" });
  });
});
