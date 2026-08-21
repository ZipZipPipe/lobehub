import { describe, expect, it } from 'vitest';

import { extractDefaultValues } from '../../standard-parameters';
import { gptImage2Schema } from '../imageParameters';

describe('image parameter schemas', () => {
  it('exposes the supported GPT Image 2 background modes', () => {
    expect(gptImage2Schema.background).toEqual({
      default: 'auto',
      enum: ['auto', 'opaque', 'transparent'],
    });
    expect(extractDefaultValues(gptImage2Schema).background).toBe('auto');
  });
});
