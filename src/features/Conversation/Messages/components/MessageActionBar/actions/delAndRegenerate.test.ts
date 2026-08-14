/**
 * @vitest-environment happy-dom
 */
import type { UIChatMessage } from '@lobechat/types';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { delAndRegenerateAction } from './delAndRegenerate';

const delAndRegenerateMessage = vi.fn();
const generationState = vi.hoisted(() => ({ isGenerating: false, isRegenerating: false }));

vi.mock('../../../../store', () => ({
  messageStateSelectors: {
    isAIGenerating: (s: any) => s.isGenerating,
    isMessageRegenerating: () => (s: any) => s.isRegenerating,
  },
  useConversationStore: (selector: (s: any) => any) =>
    selector({
      delAndRegenerateMessage,
      isGenerating: generationState.isGenerating,
      isRegenerating: generationState.isRegenerating,
    }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const build = () =>
  renderHook(() =>
    delAndRegenerateAction.useBuild({
      data: { id: 'msg-1', role: 'assistant' } as UIChatMessage,
      id: 'msg-1',
      role: 'assistant',
    }),
  ).result.current!;

describe('delAndRegenerateAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    generationState.isGenerating = false;
    generationState.isRegenerating = false;
  });

  it('is enabled after generation has settled', () => {
    expect(build().disabled).toBe(false);
  });

  it('is disabled while the original response is still generating', () => {
    generationState.isGenerating = true;

    expect(build().disabled).toBe(true);
  });
});
