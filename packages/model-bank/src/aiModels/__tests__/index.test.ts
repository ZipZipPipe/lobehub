import { describe, expect, it, vi } from 'vitest';

import { ModelProvider } from '../../const/modelProvider';
import { loadModels, LOBE_DEFAULT_MODEL_LIST } from '../index';

describe('loadModels', () => {
  it('returns the static model list by default', async () => {
    await expect(loadModels()).resolves.toBe(LOBE_DEFAULT_MODEL_LIST);
  });

  it('overrides provider models with injected async loaders', async () => {
    const loader = vi.fn().mockResolvedValue([
      {
        enabled: true,
        id: 'injected-lobehub-model',
        type: 'chat',
      },
    ]);

    const models = await loadModels({
      providerLoaders: {
        [ModelProvider.LobeHub]: loader,
      },
    });

    expect(loader).toHaveBeenCalledTimes(1);
    expect(models).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          enabled: true,
          id: 'injected-lobehub-model',
          providerId: ModelProvider.LobeHub,
          source: 'builtin',
          type: 'chat',
        }),
      ]),
    );
  });

  it('ignores undefined provider loaders', async () => {
    await expect(
      loadModels({
        providerLoaders: {
          [ModelProvider.LobeHub]: undefined,
        },
      }),
    ).resolves.toBe(LOBE_DEFAULT_MODEL_LIST);
  });

  it('propagates injected loader errors without falling back to static models', async () => {
    const loader = vi.fn().mockRejectedValue(new Error('model config missing'));

    await expect(
      loadModels({
        providerLoaders: {
          [ModelProvider.LobeHub]: loader,
        },
      }),
    ).rejects.toThrow('model config missing');
  });
});

describe('xAI models', () => {
  it('includes Grok Imagine Video 1.5 Preview as a video model', () => {
    const model = LOBE_DEFAULT_MODEL_LIST.find(
      (m) => m.providerId === ModelProvider.XAI && m.id === 'grok-imagine-video-1.5-preview',
    );

    expect(model).toEqual(
      expect.objectContaining({
        enabled: true,
        parameters: expect.objectContaining({
          duration: expect.objectContaining({ max: 15, min: 1 }),
          resolution: expect.objectContaining({ enum: ['480p', '720p'] }),
        }),
        providerId: ModelProvider.XAI,
        type: 'video',
      }),
    );
  });

  it('does not include the unsupported Grok Imagine Video 1.5 endpoint id', () => {
    const model = LOBE_DEFAULT_MODEL_LIST.find(
      (m) => m.providerId === ModelProvider.XAI && m.id === 'grok-imagine-video-1.5',
    );

    expect(model).toBeUndefined();
  });
});

describe('knowledgeCutoff backfill', () => {
  it('fills knowledgeCutoff from the canonical map for builtin models', () => {
    const opus = LOBE_DEFAULT_MODEL_LIST.find(
      (m) => m.providerId === 'anthropic' && m.id === 'claude-opus-4-8',
    );
    expect(opus?.knowledgeCutoff).toBe('2026-01');

    // aggregator spelling of the same model gets the same cutoff
    const bedrockOpus = LOBE_DEFAULT_MODEL_LIST.find(
      (m) => m.providerId === 'bedrock' && m.id === 'global.anthropic.claude-opus-4-7',
    );
    expect(bedrockOpus?.knowledgeCutoff).toBe('2026-01');
  });

  it('keeps an explicit knowledgeCutoff over the map value', async () => {
    const loader = vi.fn().mockResolvedValue([
      { enabled: true, id: 'gpt-5', knowledgeCutoff: '2020-01', type: 'chat' },
      { enabled: true, id: 'gpt-5-mini', type: 'chat' },
    ]);

    const models = await loadModels({
      providerLoaders: { [ModelProvider.LobeHub]: loader },
    });

    const lobehubModels = models.filter((m) => m.providerId === ModelProvider.LobeHub);
    expect(lobehubModels.find((m) => m.id === 'gpt-5')?.knowledgeCutoff).toBe('2020-01');
    expect(lobehubModels.find((m) => m.id === 'gpt-5-mini')?.knowledgeCutoff).toBe('2024-05');
  });
});
