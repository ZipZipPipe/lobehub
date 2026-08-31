/**
 * @vitest-environment happy-dom
 */
import type { UIChatMessage } from '@lobechat/types';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { MessageActionContext } from '../types';
import { delAction } from './del';

const deleteMessage = vi.fn();
const deleteAssistantMessage = vi.fn();
const generationState = vi.hoisted(() => ({ isGenerating: false }));

vi.mock('../../../../store', () => ({
  messageStateSelectors: {
    isAIGenerating: (s: any) => s.isGenerating,
  },
  useConversationStore: (selector: (s: any) => any) =>
    selector({
      deleteAssistantMessage,
      deleteMessage,
      isGenerating: generationState.isGenerating,
    }),
}));

// A group's id IS its head child's id — the assistantGroup bubble is a virtual
// message built from the run's first assistant row. Fixtures mirror that.
const build = (
  data: Partial<UIChatMessage>,
  role: MessageActionContext['role'] = 'group',
  id = 'step-1',
) =>
  renderHook(() => delAction.useBuild({ data: data as UIChatMessage, id, role })).result.current!;

const heteroError = { body: { agentType: 'claude-code', code: 'overloaded' } };

describe('delAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    generationState.isGenerating = false;
  });

  it('disables delete while the current conversation is still generating', () => {
    generationState.isGenerating = true;

    expect(build({ id: 'msg-1', role: 'assistant' } as any, 'assistant', 'msg-1').disabled).toBe(
      true,
    );
  });

  it('deletes only the errored tail step of a heterogeneous (CC/Codex) run', () => {
    const data = {
      id: 'step-1',
      role: 'assistantGroup',
      children: [
        { id: 'step-1', content: 'done' },
        { id: 'step-2', error: heteroError },
      ],
    } as unknown as UIChatMessage;

    build(data).handleClick!();

    // Must target the failed step's DB id (a child block), not the group id, and
    // go through the tool-aware delete so the step's tool rows don't orphan.
    expect(deleteAssistantMessage).toHaveBeenCalledWith('step-2');
    expect(deleteMessage).not.toHaveBeenCalled();
  });

  it('deletes the whole group when the errored step IS the group head', () => {
    // The run died on its first step: nothing succeeded before it, and the head's
    // id doubles as the group id — deleting it alone would strand the chain.
    const data = {
      id: 'step-1',
      role: 'assistantGroup',
      children: [{ id: 'step-1', error: heteroError }],
    } as unknown as UIChatMessage;

    build(data).handleClick!();

    expect(deleteMessage).toHaveBeenCalledWith('step-1');
    expect(deleteAssistantMessage).not.toHaveBeenCalled();
  });

  it('deletes the whole group when the tail error is NOT a heterogeneous-agent error', () => {
    // A normal grouped reply that merely ends in a generic tool/provider error
    // keeps the whole-group delete.
    const data = {
      id: 'step-1',
      role: 'assistantGroup',
      children: [
        { id: 'step-1', content: 'done' },
        { id: 'step-2', error: { type: 'PluginError', body: { message: 'boom' } } },
      ],
    } as unknown as UIChatMessage;

    build(data).handleClick!();

    expect(deleteMessage).toHaveBeenCalledWith('step-1');
    expect(deleteAssistantMessage).not.toHaveBeenCalled();
  });

  it('deletes the whole group when no step errored', () => {
    const data = {
      id: 'step-1',
      role: 'assistantGroup',
      children: [
        { id: 'step-1', content: 'done' },
        { id: 'step-2', content: 'done' },
      ],
    } as unknown as UIChatMessage;

    build(data).handleClick!();

    expect(deleteMessage).toHaveBeenCalledWith('step-1');
    expect(deleteAssistantMessage).not.toHaveBeenCalled();
  });

  it('deletes by message id for a non-group message', () => {
    build(
      { id: 'msg-1', role: 'assistant', content: 'hi' } as unknown as UIChatMessage,
      'assistant',
      'msg-1',
    ).handleClick!();

    expect(deleteMessage).toHaveBeenCalledWith('msg-1');
    expect(deleteAssistantMessage).not.toHaveBeenCalled();
  });
});
