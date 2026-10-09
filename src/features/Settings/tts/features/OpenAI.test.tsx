import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useUserStore } from '@/store/user';

import OpenAI from './OpenAI';

vi.mock('@/hooks/usePermission', () => ({
  usePermission: () => ({ allowed: true }),
}));
vi.mock('@/features/SettingsSearch/anchor', () => ({
  SettingsSearchAnchor: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('./const', () => ({
  opeanaiTTSOptions: ['gpt-4o-mini-tts', 'tts-1', 'tts-1-hd'].map((value) => ({ label: value, value })),
}));

const initialState = useUserStore.getState();
afterEach(() => useUserStore.setState(initialState, true));

describe('OpenAI TTS settings', () => {
  it('loads the saved model and persists a model selected through the form', async () => {
    const setSettings = vi.fn().mockResolvedValue(undefined);
    useUserStore.setState({
      isUserStateInit: true,
      setSettings,
      settings: { tts: { openAI: { ttsModel: 'tts-1' } } },
    });

    render(<OpenAI />);
    const select = screen.getByRole('combobox');
    expect(select.textContent).toContain('tts-1');
    await userEvent.click(select);
    await userEvent.click(await screen.findByRole('option', { name: 'tts-1-hd' }));

    await waitFor(() => {
      expect(setSettings).toHaveBeenCalledWith({ tts: { openAI: { ttsModel: 'tts-1-hd' } } });
    });
  });
});
