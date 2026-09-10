import { describe, expect, it } from 'vitest';

import { isValidCustomSize } from './SizeSelect';

const constraints = {
  aspectRatioMax: 3,
  aspectRatioMin: 1 / 3,
  maxEdge: 3840,
  maxPixels: 8_294_400,
  minPixels: 655_360,
  step: 16,
};

describe('isValidCustomSize', () => {
  it.each([
    [1536, 864],
    [2560, 1440],
    [3840, 2160],
    [2160, 3840],
  ])('accepts a supported custom size %sx%s', (width, height) => {
    expect(isValidCustomSize(width, height, constraints)).toBe(true);
  });

  it.each([
    [1000, 1000],
    [4000, 2000],
    [3840, 1264],
    [512, 512],
  ])('rejects an unsupported custom size %sx%s', (width, height) => {
    expect(isValidCustomSize(width, height, constraints)).toBe(false);
  });
});
