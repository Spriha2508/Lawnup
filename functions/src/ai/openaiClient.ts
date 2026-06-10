import OpenAI from 'openai';
import { defineSecret } from 'firebase-functions/params';

// Bound to functions that need OpenAI via { secrets: [OPENAI_KEY] }.
// Set once with: firebase functions:secrets:set OPENAI_KEY
export const OPENAI_KEY = defineSecret('OPENAI_KEY');

let client: OpenAI | null = null;

/**
 * Lazy singleton — secrets are only available at runtime inside a function
 * invocation, never at module load time (unlike the old functions.config()).
 */
export const getOpenAI = (): OpenAI => {
  if (!client) {
    client = new OpenAI({ apiKey: OPENAI_KEY.value() });
  }
  return client;
};
