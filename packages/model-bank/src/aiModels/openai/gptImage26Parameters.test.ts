import { describe, expect, it } from 'vitest';

import { gptImage2Schema } from '../../const/imageParameters';
import { ModelParamsMetaSchema } from '../../standard-parameters';
import { gptImage26Schema } from './gptImage26Parameters';

describe('gptImage26Schema', () => {
  it('declares GIF output within API bounds and six quality tiers, with custom still-image sizes', () => {
    expect(() => ModelParamsMetaSchema.parse(gptImage26Schema)).not.toThrow();
    expect(gptImage26Schema).toMatchObject({
      frameCount: { default: 9, max: 16, min: 2, step: 1 },
      frameDurationMs: { default: 200, max: 2000, min: 20, step: 10 },
      imageUrls: { default: [], maxCount: 16, maxFileSize: 52_428_800 },
      outputFormat: { default: 'png', enum: ['png', 'jpeg', 'webp', 'gif', 'svg'] },
      quality: { default: 'auto', enum: ['auto', 'low', 'medium', 'high', 'xhigh', 'max'] },
      size: { custom: { maxEdge: 3840, step: 16 } },
    });
  });

  it('keeps GIF output off GPT Image 2', () => {
    for (const key of ['outputFormat', 'frameCount', 'frameDurationMs'])
      expect(gptImage2Schema).not.toHaveProperty(key);
  });
});
