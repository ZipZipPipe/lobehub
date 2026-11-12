// @vitest-environment node
import type OpenAI from 'openai';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createOpenAICompatibleImage } from './createImage';
import { applyImageOutputParams, collectImageResponse } from './imageOutputParams';

vi.mock('@lobechat/business-model-bank/model-config', () => ({
  loadModels: vi.fn().mockResolvedValue([]),
}));

describe.each(['gpt-image-2.6-flare', 'gpt-image-2.6-sunburst'])(
  '%s Images API contract',
  (model) => {
    const generate = vi.fn();
    const edit = vi.fn();
    const client = { images: { generate, edit } } as unknown as OpenAI;
    beforeEach(() => {
      vi.clearAllMocks();
      generate.mockResolvedValue({ data: [{ b64_json: 'complete' }] });
      edit.mockResolvedValue({ data: [{ b64_json: 'complete' }] });
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          headers: { get: () => 'image/png' },
          arrayBuffer: async () => new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer,
        }),
      );
    });

    it('sends planning, quality, transparency, compression, safety and preset dimensions', async () => {
      const result = await createOpenAICompatibleImage(
        client,
        {
          model,
          params: {
            prompt: 'poster',
            complexity: 'low',
            quality: 'xhigh',
            background: 'transparent',
            moderation: 'low',
            size: '1152x2048',
            outputFormat: 'webp',
            outputCompression: 80,
            safetyIdentifier: 'opaque-test-id',
            stream: false,
            svgModel: 'stale',
            svgReasoningEffort: 'high',
            partialImages: 3,
            frameCount: 4,
            frameDurationMs: 300,
            maskUrl: '',
            markupUrl: '',
          },
        },
        'openai',
      );
      expect(generate).toHaveBeenCalledWith({
        model,
        prompt: 'poster',
        complexity: 'low',
        quality: 'xhigh',
        background: 'transparent',
        moderation: 'low',
        size: '1152x2048',
        output_format: 'webp',
        output_compression: 80,
        safety_identifier: 'opaque-test-id',
        stream: false,
      });
      expect(result.imageUrl).toBe('data:image/webp;base64,complete');
    });

    it('authors SVG and preserves its MIME type, stripping unsupported transport controls', async () => {
      const result = await createOpenAICompatibleImage(
        client,
        {
          model,
          params: {
            prompt: 'logo',
            outputFormat: 'svg',
            complexity: 'medium',
            svgModel: 'author-model',
            svgReasoningEffort: 'high',
            stream: true,
            partialImages: 2,
            outputCompression: 80,
          },
        },
        'openai',
      );
      expect(generate).toHaveBeenCalledWith({
        model,
        prompt: 'logo',
        output_format: 'svg',
        complexity: 'medium',
        n: 1,
        svg: { model: 'author-model', reasoning: { effort: 'high' } },
      });
      expect(result.imageUrl).toBe('data:image/svg+xml;base64,complete');
    });

    it('allows GIF edits with still references and keeps only GIF output controls', async () => {
      const result = await createOpenAICompatibleImage(
        client,
        {
          model,
          params: {
            prompt: 'animate',
            imageUrls: ['https://example.com/input.png'],
            outputFormat: 'gif',
            frameCount: 4,
            frameDurationMs: 300,
            complexity: 'high',
            moderation: 'low',
            stream: true,
            partialImages: 1,
            outputCompression: 50,
          },
        },
        'openai',
      );
      expect(edit).toHaveBeenCalledWith(
        expect.objectContaining({
          model,
          image: expect.any(File),
          output_format: 'gif',
          frame_count: 4,
          frame_duration_ms: 300,
          complexity: 'high',
          moderation: 'low',
        }),
      );
      expect(edit.mock.calls[0][0]).not.toHaveProperty('stream');
      expect(edit.mock.calls[0][0]).not.toHaveProperty('partial_images');
      expect(edit.mock.calls[0][0]).not.toHaveProperty('output_compression');
      expect(result.imageUrl).toBe('data:image/gif;base64,complete');
    });

    it.each(['maskUrl', 'markupUrl'] as const)(
      'uploads %s as a PNG file on the edit endpoint',
      async (field) => {
        await createOpenAICompatibleImage(
          client,
          {
            model,
            params: {
              prompt: 'edit',
              imageUrls: ['https://example.com/input.png'],
              [field]: 'https://example.com/overlay.png',
              complexity: 'low',
              outputFormat: 'png',
            },
          },
          'openai',
        );
        expect(edit.mock.calls[0][0][field === 'maskUrl' ? 'mask' : 'markup']).toBeInstanceOf(File);
        expect(edit.mock.calls[0][0]).not.toHaveProperty(field);
      },
    );

    it('rejects conflicting overlays before fetching or charging for a generation', async () => {
      await expect(
        createOpenAICompatibleImage(
          client,
          {
            model,
            params: {
              prompt: 'edit',
              imageUrls: ['https://example.com/input.png'],
              maskUrl: 'mask',
              markupUrl: 'markup',
            },
          },
          'openai',
        ),
      ).rejects.toThrow('either a mask or a markup');
      expect(fetch).not.toHaveBeenCalled();
      expect(edit).not.toHaveBeenCalled();
    });

    it('rejects a non-PNG overlay before calling the paid edit endpoint', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          headers: { get: () => 'image/jpeg' },
          arrayBuffer: async () => new Uint8Array([0xff, 0xd8, 0xff]).buffer,
        }),
      );
      await expect(
        createOpenAICompatibleImage(
          client,
          {
            model,
            params: {
              prompt: 'edit',
              imageUrls: ['https://example.com/input.png'],
              markupUrl: 'https://example.com/wrong.jpg',
            },
          },
          'openai',
        ),
      ).rejects.toThrow('transparent PNG');
      expect(edit).not.toHaveBeenCalled();
    });

    it('consumes streaming previews but stores only the final image', async () => {
      generate.mockResolvedValue(
        (async function* () {
          yield { type: 'image_generation.partial_image', b64_json: 'partial' };
          yield { type: 'image_generation.completed', b64_json: 'final', output_format: 'png' };
        })(),
      );
      const result = await createOpenAICompatibleImage(
        client,
        {
          model,
          params: {
            prompt: 'stream',
            stream: true,
            partialImages: 2,
            outputFormat: 'png',
            complexity: 'medium',
          },
        },
        'openai',
      );
      expect(generate).toHaveBeenCalledWith(
        expect.objectContaining({ stream: true, partial_images: 2 }),
      );
      expect(result.imageUrl).toBe('data:image/png;base64,final');
    });
  },
);

describe('conditional output validation', () => {
  it('omits an empty SVG author so the provider can use its default', () => {
    const input = { outputFormat: 'svg', svgModel: '', svgReasoningEffort: 'auto' };
    applyImageOutputParams(input, { isImageEdit: false });
    expect(input).toEqual({ output_format: 'svg', n: 1 });
  });
  it('rejects an oversized safety identifier', () => {
    expect(() =>
      applyImageOutputParams({ safetyIdentifier: 'x'.repeat(129) }, { isImageEdit: false }),
    ).toThrow('128');
  });
  it('does not treat an interrupted stream containing only previews as success', async () => {
    await expect(
      collectImageResponse(
        (async function* () {
          yield { type: 'image_generation.partial_image', b64_json: 'partial' };
        })(),
      ),
    ).rejects.toThrow('without a completed image');
  });
});
