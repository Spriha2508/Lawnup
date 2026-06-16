/**
 * Open Doc. Sage with inherited context (continuity).
 *
 * One assistant: Doc. Sage IS the AI Doctor. Callers from Plant Detail, Scan
 * Result, Soil Advisor and Light Assessment seed a focused plant/diagnosis +
 * opening prompt via the chat store, then this navigates to the Chat tab.
 * `navigate('Chat')` bubbles up the navigator tree from any nested stack
 * (the Chat tab's nested screen is `ChatHome`), so no getParent() chains.
 *
 * `navigation` is intentionally loosely typed — callers pass props from many
 * different stacks and 'Chat' resolves by tree-bubbling, not a single param list.
 */
import { useChatStore, type ActivePlant } from '../features/ai-doctor/store/chatStore';
import type { BanyanDiagnosis } from '../services/knowledge';

// `navigation` is `any`: callers pass props from many stacks; 'Chat' resolves by tree-bubbling.
export function askDrBanyan(
  navigation: any,
  ctx: { plant?: ActivePlant | null; diagnosis?: BanyanDiagnosis | null; prompt?: string | null } = {},
): void {
  useChatStore.getState().startContext(ctx);
  navigation.navigate('Chat');
}
