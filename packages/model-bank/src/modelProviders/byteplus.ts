import type { ModelProviderCard } from '@/types/llm';

// ref https://docs.byteplus.com/en/docs/ModelArk/Model-IDs
const BytePlus: ModelProviderCard = {
  chatModels: [],
  description:
    "BytePlus ModelArk is ByteDance's international model service platform, providing OpenAI-compatible access to Seed, Doubao, and other foundation models for global deployments.",
  id: 'byteplus',
  modelsUrl: 'https://docs.byteplus.com/en/docs/ModelArk/Model-IDs',
  name: 'BytePlus ModelArk',
  settings: {
    disableBrowserRequest: true,
    proxyUrl: {
      placeholder: 'https://ark.ap-southeast.bytepluses.com/api/v3',
    },
    sdkType: 'openai',
    showAddNewModel: false,
    showChecker: false,
    showModelFetcher: false,
  },
  url: 'https://www.byteplus.com/en/product/modelark',
};

export default BytePlus;
