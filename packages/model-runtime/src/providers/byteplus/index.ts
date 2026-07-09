import { ModelProvider } from 'model-bank';

import { createOpenAICompatibleRuntime } from '../../core/openaiCompatibleFactory';
import { createVolcengineImage } from '../volcengine/createImage';

export const LobeBytePlusAI = createOpenAICompatibleRuntime({
  baseURL: 'https://ark.ap-southeast.bytepluses.com/api/v3',
  createImage: createVolcengineImage,
  debug: {
    chatCompletion: () => process.env.DEBUG_BYTEPLUS_CHAT_COMPLETION === '1',
    responses: () => process.env.DEBUG_BYTEPLUS_RESPONSES === '1',
  },
  provider: ModelProvider.BytePlus,
});
