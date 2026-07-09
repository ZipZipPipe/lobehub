import type { AIImageModelCard } from '../types/aiModel';

const seedream50ProParameters: AIImageModelCard['parameters'] = {
  height: { default: 2048, max: 16_384, min: 480, step: 1 },
  imageUrls: { default: [], maxCount: 14, maxFileSize: 10 * 1024 * 1024 },
  prompt: {
    default: '',
  },
  promptExtend: { default: 'off', enum: ['off', 'standard'] },
  watermark: { default: false },
  webSearch: { default: false },
  width: { default: 2048, max: 16_384, min: 480, step: 1 },
};

// https://docs.byteplus.com/en/docs/ModelArk/Model-IDs
const bytePlusImageModels: AIImageModelCard[] = [
  {
    description:
      'Seedream 5.0 Pro is ByteDance Seedream 5.0 series image generation model on BytePlus ModelArk, built for high-quality professional visual creation with strong prompt following, reference consistency, and image editing capabilities.',
    displayName: 'Seedream 5.0 Pro',
    enabled: true,
    id: 'seedream-5-0-pro-260628',
    organization: 'ByteDance',
    parameters: seedream50ProParameters,
    releasedAt: '2026-06-28',
    type: 'image',
  },
  {
    description:
      'Dola-Seedream-5.0 Pro is a BytePlus ModelArk online inference endpoint for Seedream 5.0 Pro with input pre-filtering disabled.',
    displayName: 'Dola-Seedream-5.0 Pro',
    enabled: true,
    id: 'ep-20260709084715-c64bj',
    organization: 'ByteDance',
    parameters: seedream50ProParameters,
    releasedAt: '2026-07-09',
    type: 'image',
  },
];

export default bytePlusImageModels;
