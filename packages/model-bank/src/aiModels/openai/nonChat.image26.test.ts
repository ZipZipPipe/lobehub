import { describe, expect, it } from 'vitest';

import { extractDefaultValues, ModelParamsMetaSchema } from '../../standard-parameters';
import { openaiImageModels } from './nonChat';

describe('GPT Image 2.6', () => {
  it.each(['gpt-image-2.6-sunburst', 'gpt-image-2.6-flare'])(
    'exposes %s with validated native animation controls',
    (id) => {
      const model = openaiImageModels.find((card) => card.id === id)!;
      expect(model).toMatchObject({ enabled: true, isOfficial: true, type: 'image' });
      expect(ModelParamsMetaSchema.safeParse(model.parameters).success).toBe(true);
      expect(model.parameters.outputFormat?.enum).toEqual(['png', 'jpeg', 'webp', 'gif', 'svg']);
      expect(model.parameters.frameCount).toMatchObject({ max: 16, min: 2 });
      expect(model.parameters.frameDurationMs).toMatchObject({ max: 2000, min: 20, step: 10 });
      expect(extractDefaultValues(model.parameters)).toMatchObject({
        frameCount: 9,
        frameDurationMs: 200,
        outputFormat: 'png',
        size: 'auto',
      });
    },
  );

  it('keeps GIF controls off older models', () => {
    const older = openaiImageModels.filter((card) => !card.id.startsWith('gpt-image-2.6-'));
    expect(older.every((card) => !card.parameters.outputFormat?.enum.includes('gif'))).toBe(true);
  });
});
