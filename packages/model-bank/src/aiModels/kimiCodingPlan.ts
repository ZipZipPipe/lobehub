import { type AIChatModelCard } from '../types/aiModel';

// ref: https://www.kimi.com/code/docs/kimi-code/models.html

const kimiCodingPlanChatModels: AIChatModelCard[] = [
  {
    abilities: {
      functionCall: true,
      reasoning: true,
      video: true,
      vision: true,
    },
    contextWindowTokens: 1_048_576,
    description:
      'Kimi K3.1 Pro supports image and video input and up to 1M context depending on membership. Thinking is always enabled with low, high, or max effort (default max).',
    displayName: 'Kimi K3.1 Pro',
    enabled: true,
    family: 'kimi',
    generation: 'kimi-k3.1',
    id: 'k3.1-pro',
    organization: 'Moonshot',
    releasedAt: '2026-10-23',
    settings: {
      disabledParams: ['frequency_penalty', 'presence_penalty', 'temperature', 'top_p'],
      extendParams: ['kimiK3ReasoningEffort'],
    },
    type: 'chat',
  },
  {
    abilities: {
      functionCall: true,
      reasoning: true,
      video: true,
      vision: true,
    },
    contextWindowTokens: 1_048_576,
    description:
      'Kimi K3.1 Pro Highspeed supports image and video input and up to 1M context depending on membership. Thinking is always enabled with low, high, or max effort (default max). Highspeed offers approximately 2-3x speed at about twice the quota consumption.',
    displayName: 'Kimi K3.1 Pro Highspeed',
    enabled: true,
    family: 'kimi',
    generation: 'kimi-k3.1',
    id: 'k3.1-pro-highspeed',
    organization: 'Moonshot',
    releasedAt: '2026-10-23',
    settings: {
      disabledParams: ['frequency_penalty', 'presence_penalty', 'temperature', 'top_p'],
      extendParams: ['kimiK3ReasoningEffort'],
    },
    type: 'chat',
  },
  {
    abilities: {
      functionCall: true,
      reasoning: true,
      structuredOutput: true,
      video: true,
      vision: true,
    },
    config: {
      deploymentName: 'k3',
    },
    contextWindowTokens: 256_000,
    description:
      'Kimi K3 is the most capable Kimi model available through Kimi Code, with strong coding, long-horizon agent, visual understanding, and deep reasoning capabilities.',
    displayName: 'Kimi K3',
    enabled: true,
    family: 'kimi',
    generation: 'kimi-k3',
    id: 'kimi-k3',
    organization: 'Moonshot',
    releasedAt: '2026-07-16',
    settings: {
      disabledParams: ['frequency_penalty', 'presence_penalty', 'temperature', 'top_p'],
      extendParams: ['kimiK3ReasoningEffort'],
    },
    type: 'chat',
  },
  {
    abilities: {
      functionCall: true,
      reasoning: true,
      video: true,
      vision: true,
    },
    config: {
      deploymentName: 'k2p5',
    },
    contextWindowTokens: 262_144,
    description:
      "Kimi K2.5 is Kimi's most versatile model to date, featuring a native multimodal architecture that supports both vision and text inputs, 'thinking' and 'non-thinking' modes, and both conversational and agent tasks.",
    displayName: 'Kimi K2.5',
    enabled: true,
    family: 'kimi',
    generation: 'kimi-k2.5',
    id: 'kimi-k2.5',
    maxOutput: 32_768,
    organization: 'Moonshot',
    releasedAt: '2026-01-27',
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
    contextWindowTokens: 262_144,
    description:
      'Kimi K2 Thinking: Thinking model with general Agentic capabilities and reasoning abilities.',
    displayName: 'Kimi K2 Thinking',
    family: 'kimi',
    generation: 'kimi-k2',
    id: 'kimi-k2-thinking',
    maxOutput: 65_536,
    organization: 'Moonshot',
    releasedAt: '2025-11-06',
    settings: {
      extendParams: ['enableReasoning', 'reasoningBudgetToken'],
    },
    type: 'chat',
  },
];

export default kimiCodingPlanChatModels;
