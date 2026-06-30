import { describe, expect, it } from 'vitest';

import { PreferenceMemoryItemSchema } from './preference';

const validPreferenceMemory = {
  details: 'The user prefers concise operational summaries.',
  memoryCategory: 'communication',
  memoryType: 'preference',
  summary: 'Prefers concise summaries',
  tags: ['communication'],
  title: 'Concise summaries',
  withPreference: {
    appContext: null,
    conclusionDirectives: 'Use concise operational summaries.',
    extractedLabels: ['concise'],
    extractedScopes: ['{"scope":"summaries"}'],
    originContext: null,
    scorePriority: 0.8,
    suggestions: [],
    type: 'communication',
  },
};

describe('PreferenceMemoryItemSchema', () => {
  it('defaults omitted sourceIds to an empty array', () => {
    const parsed = PreferenceMemoryItemSchema.parse(validPreferenceMemory);

    expect(parsed.sourceIds).toEqual([]);
  });

  it('preserves provided sourceIds', () => {
    const parsed = PreferenceMemoryItemSchema.parse({
      ...validPreferenceMemory,
      sourceIds: ['message-1'],
    });

    expect(parsed.sourceIds).toEqual(['message-1']);
  });
});
