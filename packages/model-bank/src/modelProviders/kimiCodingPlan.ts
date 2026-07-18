import type { ModelProviderCard } from '@/types/llm';

// ref: https://www.kimi.com/code/docs/kimi-code/models.html
const KimiCodingPlan: ModelProviderCard = {
  chatModels: [],
  checkModel: 'kimi-k2.5',
  description:
    'Kimi Code from Moonshot AI provides subscription access to Kimi models including K3 for coding tasks.',
  disableBrowserRequest: true,
  id: 'kimicodingplan',
  modelList: { showModelFetcher: false },
  modelsUrl: 'https://www.kimi.com/code/docs/kimi-code/models.html',
  name: 'Kimi Code',
  settings: {
    disableBrowserRequest: true,
    proxyUrl: {
      placeholder: 'https://api.kimi.com/coding',
    },
    responseAnimation: {
      speed: 2,
      text: 'smooth',
    },
    sdkType: 'anthropic',
    showDeployName: true,
    showModelFetcher: false,
  },
  url: 'https://www.kimi.com/code',
};

export default KimiCodingPlan;
