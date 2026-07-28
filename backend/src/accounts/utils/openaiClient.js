/**
 * Shared OpenAI chat helper for text responses (AI Report, etc.).
 */
export async function chatCompletion({ systemPrompt, userMessage, temperature = 0.2 }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key is not configured on the server (OPENAI_API_KEY)");
  }

  const model = process.env.OPENAI_REPORT_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: 4096,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || "OpenAI request failed");
  }

  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("No response from AI");
  return text;
}
