import { type AIChatModelCard } from '../types/aiModel';

// ref: https://docs.bigmodel.cn/cn/coding-plan/latest-model
// ref: https://docs.bigmodel.cn/cn/guide/models/text/glm-5.3
// ref: https://docs.z.ai/guides/vlm/glm-5.3-flash

const glmCodingPlanChatModels: AIChatModelCard[] = [
  {
    abilities: {
      files: true,
      functionCall: true,
      reasoning: true,
      structuredOutput: true,
      video: true,
      vision: true,
    },
    contextWindowTokens: 1_000_000,
    description:
      "GLM-5.3-Flash is the first native multimodal model in Zhipu's GLM-5 series. It combines stronger intelligence than GLM-5.2 with efficient inference, native visual coding, long-context agentic work, and three times the GLM Coding Plan quota of GLM-5.3.",
    displayName: 'GLM-5.3-Flash',
    enabled: true,
    family: 'glm',
    generation: 'glm-5.3',
    id: 'glm-5.3-flash',
    maxOutput: 131_072,
    organization: 'Zhipu',
    releasedAt: '2026-08-30',
    settings: {
      extendParams: ['glm5_3ReasoningEffort'],
    },
    type: 'chat',
  },
  {
    abilities: {
      functionCall: true,
      reasoning: true,
    },
    contextWindowTokens: 1_000_000,
    description:
      "GLM-5.3 is Zhipu's latest flagship model, built on the same foundation as GLM-5.2 with substantially scaled long-horizon post-training. It delivers stronger coding, agentic engineering, and cybersecurity capabilities for complex, long-running tasks.",
    displayName: 'GLM-5.3',
    enabled: true,
    family: 'glm',
    generation: 'glm-5.3',
    id: 'glm-5.3',
    maxOutput: 131_072,
    organization: 'Zhipu',
    releasedAt: '2026-08-14',
    settings: {
      extendParams: ['glm5_3ReasoningEffort'],
    },
    type: 'chat',
  },
  {
    abilities: {
      functionCall: true,
      reasoning: true,
    },
    contextWindowTokens: 204_800,
    description:
      "GLM-5.1 is Zhipu's latest flagship model, an enhanced iteration of GLM-5 with improved agentic engineering capabilities for complex systems engineering and long-horizon tasks.",
    displayName: 'GLM-5.1',
    enabled: true,
    family: 'glm',
    generation: 'glm-5.1',
    id: 'GLM-5.1',
    maxOutput: 131_072,
    organization: 'Zhipu',
    releasedAt: '2026-03-27',
    settings: {
      extendParams: ['enableReasoning'],
    },
    type: 'chat',
  },
  {
    abilities: {
      functionCall: true,
      reasoning: true,
    },
    contextWindowTokens: 200_000,
    description:
      "GLM-5 is Zhipu's next-generation flagship foundation model, purpose-built for Agentic Engineering. It delivers reliable productivity in complex systems engineering and long-horizon agentic tasks. In coding and agent capabilities, GLM-5 achieves state-of-the-art performance among open-source models.",
    displayName: 'GLM-5',
    enabled: true,
    family: 'glm',
    generation: 'glm-5',
    id: 'GLM-5',
    maxOutput: 131_072,
    organization: 'Zhipu',
    releasedAt: '2026-02-12',
    settings: {
      extendParams: ['enableReasoning'],
    },
    type: 'chat',
  },
  {
    abilities: {
      functionCall: true,
      reasoning: true,
    },
    contextWindowTokens: 200_000,
    description: 'GLM-5-Turbo: Optimized version of GLM-5 with faster inference for coding tasks.',
    displayName: 'GLM-5-Turbo',
    enabled: true,
    family: 'glm',
    generation: 'glm-5',
    id: 'GLM-5-Turbo',
    maxOutput: 131_072,
    organization: 'Zhipu',
    releasedAt: '2026-02-12',
    settings: {
      extendParams: ['enableReasoning'],
    },
    type: 'chat',
  },
  {
    abilities: {
      functionCall: true,
      reasoning: true,
    },
    contextWindowTokens: 200_000,
    description:
      "GLM-4.7 is Zhipu's latest flagship model, enhanced for Agentic Coding scenarios with improved coding capabilities, long-term task planning, and tool collaboration.",
    displayName: 'GLM-4.7',
    enabled: true,
    family: 'glm',
    generation: 'glm-4.7',
    id: 'GLM-4.7',
    maxOutput: 131_072,
    organization: 'Zhipu',
    releasedAt: '2025-12-01',
    settings: {
      extendParams: ['enableReasoning'],
    },
    type: 'chat',
  },
  {
    abilities: {
      functionCall: true,
    },
    contextWindowTokens: 202_752,
    description: 'GLM-4.6: Previous generation model.',
    displayName: 'GLM-4.6',
    family: 'glm',
    generation: 'glm-4.6',
    id: 'GLM-4.6',
    maxOutput: 65_536,
    organization: 'Zhipu',
    releasedAt: '2025-12-01',
    type: 'chat',
  },
  {
    abilities: {
      functionCall: true,
    },
    contextWindowTokens: 202_752,
    description: 'GLM-4.5: High-performance model for reasoning, coding, and agent tasks.',
    displayName: 'GLM-4.5',
    family: 'glm',
    generation: 'glm-4.5',
    id: 'GLM-4.5',
    maxOutput: 65_536,
    organization: 'Zhipu',
    releasedAt: '2025-12-01',
    type: 'chat',
  },
  {
    abilities: {
      functionCall: true,
    },
    contextWindowTokens: 202_752,
    description: 'GLM-4.5-Air: Lightweight version for fast responses.',
    displayName: 'GLM-4.5-Air',
    family: 'glm',
    generation: 'glm-4.5',
    id: 'GLM-4.5-Air',
    maxOutput: 65_536,
    organization: 'Zhipu',
    releasedAt: '2025-12-01',
    type: 'chat',
  },
];

export default glmCodingPlanChatModels;
