import { describe, expect, it } from 'vitest';

import { extractDefaultValues } from '../../standard-parameters';
import { gptImage2Schema, gptImage25Schema } from '../imageParameters';

describe('image parameter schemas', () => {
  it('exposes the supported GPT Image 2 background modes', () => {
    expect(gptImage2Schema.background).toEqual({
      default: 'auto',
      enum: ['auto', 'opaque', 'transparent'],
    });
    expect(extractDefaultValues(gptImage2Schema).background).toBe('auto');
  });

  it('exposes the official GPT Image 2.5 controls and defaults', () => {
    expect(gptImage25Schema).toEqual(
      expect.objectContaining({
        background: { default: 'auto', enum: ['auto', 'opaque', 'transparent'] },
        imageUrls: { default: [], maxCount: 16, maxFileSize: 50 * 1024 * 1024 },
        moderation: { default: 'auto', enum: ['auto', 'low'] },
        outputCompression: { default: 100, max: 100, min: 0, step: 1 },
        outputFormat: { default: 'png', enum: ['png', 'jpeg', 'webp'] },
        quality: {
          default: 'auto',
          enum: ['auto', 'low', 'medium', 'high', 'xhigh', 'max'],
        },
      }),
    );

    expect(gptImage25Schema.size).toEqual({
      custom: {
        aspectRatioMax: 3,
        aspectRatioMin: 1 / 3,
        maxEdge: 3840,
        maxPixels: 8_294_400,
        minPixels: 655_360,
        step: 16,
      },
      default: 'auto',
      enum: ['auto', '1024x1024', '1536x1024', '1024x1536'],
    });
    expect(extractDefaultValues(gptImage25Schema)).toEqual(
      expect.objectContaining({
        background: 'auto',
        moderation: 'auto',
        outputCompression: 100,
        outputFormat: 'png',
        quality: 'auto',
        size: 'auto',
      }),
    );
  });
});
