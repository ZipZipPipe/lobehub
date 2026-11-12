import { describe, expect, it } from 'vitest';

import { extractDefaultValues, ModelParamsMetaSchema } from '../standard-parameters';
import { GPT_IMAGE_26_SIZE_PRESETS, gptImage25Schema, gptImage26Schema } from './imageParameters';

describe('GPT Image 2.6 parameter contract', () => {
  it('retains every supported setting through metadata parsing and default extraction', () => {
    const schema = ModelParamsMetaSchema.parse(gptImage26Schema);
    expect(schema.complexity?.enum).toEqual(['low', 'medium', 'high']);
    expect(schema.outputFormat?.enum).toEqual(['png', 'jpeg', 'webp', 'gif', 'svg']);
    expect(extractDefaultValues(schema)).toMatchObject({
      complexity: 'high',
      markupUrl: '',
      maskUrl: '',
      partialImages: 0,
      safetyIdentifier: '',
      stream: false,
      svgModel: '',
      svgReasoningEffort: 'auto',
    });
    expect(schema.size?.presets).toHaveLength(26);
    expect(gptImage25Schema).not.toHaveProperty('complexity');
    expect(gptImage25Schema.outputFormat?.enum).not.toContain('svg');
  });

  it('includes the requested portrait, photo and ultrawide presets', () => {
    expect(gptImage26Schema.size?.enum).toEqual(
      expect.arrayContaining([
        '1152x2048',
        '2160x3840',
        '2048x1536',
        '3264x2448',
        '2016x864',
        '3808x1632',
      ]),
    );
  });

  it.each(GPT_IMAGE_26_SIZE_PRESETS)(
    'keeps $aspectRatio $resolution $value inside official limits',
    ({ aspectRatio, value }) => {
      const [width, height] = value.split('x').map(Number);
      const [rw, rh] = aspectRatio.split(':').map(Number);
      expect(width * rh).toBe(height * rw);
      expect(width % 16).toBe(0);
      expect(height % 16).toBe(0);
      expect(Math.max(width, height)).toBeLessThanOrEqual(3840);
      expect(width * height).toBeGreaterThanOrEqual(655_360);
      expect(width * height).toBeLessThanOrEqual(8_294_400);
    },
  );
});
