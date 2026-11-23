import { ModelProvider, openaiChatModels } from 'model-bank';

import { pruneReasoningPayload } from '../../core/contextBuilders/openai';
import type { OpenAICompatibleFactoryOptions } from '../../core/openaiCompatible';
import { createOpenAICompatibleRuntime } from '../../core/openaiCompatible';
import type { ChatStreamPayload } from '../../types';
import { processMultiProviderModelList } from '../../utils/modelParse';
import { appendDecisionModels } from '../../utils/postProcessModelList';
import {
  isGPTProResponsesModel,
  isOpenAIComputerUseModel,
  isOpenAIReasoningPayloadModel,
  isResponsesAPIModel,
  supportsOpenAIServiceTierFlex,
} from './modelId';

export interface OpenAIModelCard {
  id: string;
}

const hasAudioInput = (payload: ChatStreamPayload) =>
  payload.messages.some(
    (message) =>
      Array.isArray(message.content) && message.content.some((part) => part.type === 'audio_url'),
  );

const oaiSearchContextSize = process.env.OPENAI_SEARCH_CONTEXT_SIZE; // low, medium, high
const enableServiceTierFlex = process.env.OPENAI_SERVICE_TIER_FLEX === '1';

export const params = {
  baseURL: 'https://api.openai.com/v1',
  chatCompletion: {
    contextPreFlight: { models: openaiChatModels },
    handlePayload: (payload) => {
      const { enabledSearch, model, ...rest } = payload;
      const containsAudioInput = hasAudioInput(payload);

      if (!containsAudioInput && (isResponsesAPIModel(model) || enabledSearch)) {
        return { ...rest, apiMode: 'responses', enabledSearch, model } as ChatStreamPayload;
      }

      if (isOpenAIReasoningPayloadModel(model)) {
        return pruneReasoningPayload({
          ...rest,
          ...(containsAudioInput && { apiMode: 'chatCompletion' }),
          model,
        } as ChatStreamPayload) as any;
      }

      if (model.includes('-search-')) {
        return {
          ...rest,
          frequency_penalty: undefined,
          model,
          presence_penalty: undefined,
          stream: payload.stream ?? true,
          temperature: undefined,
          top_p: undefined,
          ...(enableServiceTierFlex &&
            supportsOpenAIServiceTierFlex(model) && { service_tier: 'flex' }),
          ...(oaiSearchContextSize && {
            web_search_options: {
              search_context_size: oaiSearchContextSize,
            },
          }),
        } as any;
      }

      return {
        ...rest,
        ...(containsAudioInput && { apiMode: 'chatCompletion' }),
        model,
        ...(enableServiceTierFlex &&
          supportsOpenAIServiceTierFlex(model) && { service_tier: 'flex' }),
        stream: payload.stream ?? true,
      };
    },
    supportsAudioInput: true,
  },
  /** @see https://developers.openai.com/api/docs/guides/decisions */
  decide: { path: '/decisions', protocol: 'openai' },
  debug: {
    chatCompletion: () => process.env.DEBUG_OPENAI_CHAT_COMPLETION === '1',
    responses: () => process.env.DEBUG_OPENAI_RESPONSES === '1',
  },
  models: async ({ client }) => {
    const modelsPage = (await client.models.list()) as any;
    const modelList: OpenAIModelCard[] = modelsPage.data;

    // Automatically detect model provider and select corresponding configuration
    const models = await processMultiProviderModelList(modelList, 'openai');
    // `decide` serves these through `/decisions`, so list their `:decision` cards too.
    return appendDecisionModels(models);
  },
  provider: ModelProvider.OpenAI,
  responses: {
    handlePayload: (payload) => {
      const { enabledSearch, model, tools, verbosity, ...rest } = payload;

      const openaiTools = enabledSearch
        ? [
            ...(tools || []),
            {
              type: 'web_search',
              ...(oaiSearchContextSize && {
                search_context_size: oaiSearchContextSize,
              }),
            },
          ]
        : tools;

      if (isOpenAIReasoningPayloadModel(model)) {
        const reasoning = payload.reasoning
          ? { ...payload.reasoning, summary: 'auto' }
          : { summary: 'auto' };
        if (isGPTProResponsesModel(model)) {
          reasoning.effort = 'high';
        }
        return pruneReasoningPayload({
          ...rest,
          model,
          reasoning,
          ...(enableServiceTierFlex &&
            supportsOpenAIServiceTierFlex(model) && { service_tier: 'flex' }),
          stream: payload.stream ?? true,
          tools: openaiTools as any,
          // computer-use series must set truncation as auto
          ...(isOpenAIComputerUseModel(model) && { truncation: 'auto' }),
          text: verbosity ? { verbosity } : undefined,
        }) as any;
      }

      return {
        ...rest,
        model,
        ...(enableServiceTierFlex &&
          supportsOpenAIServiceTierFlex(model) && { service_tier: 'flex' }),
        stream: payload.stream ?? true,
        tools: openaiTools,
      } as any;
    },
    prepareRequest: (payload) => {
      if (
        !payload.tools ||
        (payload.model !== 'gpt-6.2-astra' && payload.model !== 'gpt-6.2-sol')
      ) {
        return { payload };
      }

      const tools = payload.tools.map((tool) => {
        if (tool.type !== 'function') return tool;

        const properties = tool.parameters?.properties as
          | {
              fieldNames?: { description?: string; uniqueItems?: boolean };
              operations?: { items?: { oneOf?: unknown } };
            }
          | undefined;

        const fieldNames = properties?.fieldNames;
        if (
          tool.name === 'lobe-creds____requestCredsInput' &&
          tool.strict !== false &&
          fieldNames?.uniqueItems === true
        ) {
          // Keep strict compilation available for the rest of the credential schema.
          const compatibleFieldNames = {
            ...fieldNames,
            description: [fieldNames.description, 'Each field name must be unique.']
              .filter(Boolean)
              .join(' '),
          };
          delete compatibleFieldNames.uniqueItems;

          return {
            ...tool,
            parameters: {
              ...tool.parameters,
              properties: { ...properties, fieldNames: compatibleFieldNames },
            },
          };
        }

        // GPT-6.2's implicit strict compilation rejects the operations union.
        return tool.name === 'lobe-agent-documents____modifyNodes' &&
          typeof tool.strict !== 'boolean' &&
          Array.isArray(properties?.operations?.items?.oneOf)
          ? { ...tool, strict: false }
          : tool;
      });

      return { payload: { ...payload, tools } };
    },
  },
} satisfies OpenAICompatibleFactoryOptions;

export const LobeOpenAI = createOpenAICompatibleRuntime(params);
