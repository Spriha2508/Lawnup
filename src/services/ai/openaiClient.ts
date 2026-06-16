// Client-side OpenAI chat client for Doc. Sage (internal-testing mode).
//
// Mirrors the Plant.id pattern: the key is read from the NON-PUBLIC
// `openaiKey` baked via app.config.ts → extra (process.env.OPENAI_API_KEY).
// This bundles the key — accepted only because there is no public APK; at
// production hardening this moves to the generateAIResponse Cloud Function.

import Constants from 'expo-constants';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini'; // cheap, capable; matches the existing functions/src/ai default tier
const REQUEST_TIMEOUT_MS = 30_000;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

function resolveKey(): string {
  const raw = (Constants.expoConfig?.extra?.openaiKey as string | undefined) ?? '';
  return raw.replace(/\s+/g, '').replace(/^["']+|["']+$/g, '');
}

export function isOpenAIConfigured(): boolean {
  return resolveKey().length > 0;
}

export interface ChatCompleteOptions {
  system: string;
  messages: ChatMessage[];   // conversation turns (user/assistant), oldest→newest
  signal?: AbortSignal;
  maxTokens?: number;
  temperature?: number;
}

/** Single-shot chat completion. Returns the assistant's text. */
export async function chatComplete({
  system, messages, signal, maxTokens = 600, temperature = 0.5,
}: ChatCompleteOptions): Promise<string> {
  const apiKey = resolveKey();
  if (!apiKey) {
    throw new Error('OpenAI key not set — Doc. Sage is unavailable (internal-testing mode)');
  }

  const internalController = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => { timedOut = true; internalController.abort(); }, REQUEST_TIMEOUT_MS);
  const onExternalAbort = () => internalController.abort();
  signal?.addEventListener('abort', onExternalAbort);

  let response: Response;
  try {
    response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'system', content: system }, ...messages],
        max_tokens: maxTokens,
        temperature,
      }),
      signal: internalController.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      if (timedOut) throw new Error('Doc. Sage took too long to respond — please try again');
      throw new Error('Request cancelled');
    }
    const msg = err instanceof Error ? err.message.toLowerCase() : '';
    if (msg.includes('network request failed') || msg.includes('offline') || msg.includes('failed to fetch')) {
      throw new Error('No internet — check your connection and try again');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', onExternalAbort);
  }

  const rawText = await response.text();
  if (!response.ok) {
    if (__DEV__) console.warn('[OpenAI] HTTP', response.status, rawText.slice(0, 300));
    if (response.status === 429) throw new Error('Doc. Sage is busy right now — please try again in a moment');
    throw new Error(`Doc. Sage error (HTTP ${response.status})`);
  }

  let data: { choices?: { message?: { content?: string } }[] };
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error('Doc. Sage sent an unreadable response — please try again');
  }
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('Doc. Sage had nothing to say — please try again');
  return content;
}
