import { useEffect, useState } from "react";
import { AI_PROVIDERS, AiProvider } from "@hrm-plus/shared";
import { Button, Card, Field, Input, Select, Spinner } from "@hrm-plus/ui";
import { getAiSettings, updateAiSettings } from "../../api/aiSettings";

const PROVIDER_LABELS: Record<AiProvider, string> = {
  GROQ: "Groq",
  GEMINI: "Google Gemini",
};

const PROVIDER_MODEL_PLACEHOLDER: Record<AiProvider, string> = {
  GROQ: "openai/gpt-oss-20b",
  GEMINI: "gemini-2.0-flash",
};

export default function AiSettings() {
  const [provider, setProvider] = useState<AiProvider>("GROQ");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getAiSettings()
      .then((settings) => {
        setProvider(settings.provider);
        setModel(settings.model ?? "");
        setHasApiKey(settings.hasApiKey);
      })
      .catch((err) => setError(err.response?.data?.error?.message ?? "Failed to load AI settings"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await updateAiSettings({
        provider,
        model: model.trim() || null,
        apiKey: apiKey.trim() || undefined,
      });
      setHasApiKey(updated.hasApiKey);
      setApiKey("");
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? "Failed to save AI settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}
      {saved && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">AI settings saved.</div>
      )}

      <Card
        title="Question generation & grading"
        description="Choose which LLM provider generates screening questions from a job's title/skills/description and grades short-answer responses. Admin only."
      >
        <div className="space-y-4 max-w-md">
          <Field label="Provider">
            <Select value={provider} onChange={(e) => setProvider(e.target.value as AiProvider)}>
              {AI_PROVIDERS.map((p) => (
                <option key={p} value={p}>
                  {PROVIDER_LABELS[p]}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Model" helperText={`Leave blank to use the default (${PROVIDER_MODEL_PLACEHOLDER[provider]})`}>
            <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder={PROVIDER_MODEL_PLACEHOLDER[provider]} />
          </Field>

          <Field
            label="API key"
            helperText={hasApiKey ? "A key is already configured — leave blank to keep it." : "No key configured yet."}
          >
            <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={hasApiKey ? "••••••••" : ""} />
          </Field>

          <Button onClick={handleSave} isLoading={saving}>
            Save
          </Button>
        </div>
      </Card>
    </div>
  );
}
