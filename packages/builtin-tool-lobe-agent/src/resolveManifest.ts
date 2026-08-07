import type { BuiltinManifestResolver } from '@lobechat/types';

import { LobeAgentManifest } from './manifest';
import {
  systemPromptWithoutMultimodalAnalysis,
  systemPromptWithoutSubAgent,
  systemPromptWithoutSubAgentAndMultimodalAnalysis,
} from './systemRole';
import { LobeAgentApiName } from './types';

/**
 * Context-aware manifest for the lobe-agent tool.
 *
 * `lobe-agent` bundles plan / todo / media-analysis APIs together with the
 * `callSubAgent` dispatch. Individual APIs are hidden in these contexts:
 *
 * - **Inside a group** (`scope` is `group` / `group_agent`): coordination already
 *   happens through real member agents via GroupManagement; an isolated ad-hoc
 *   sub-agent on top of that is redundant and confusing.
 * - **Inside a sub-agent** (`isSubAgent`): a nested sub-agent must not spawn
 *   further sub-agents.
 * - **Native multimodal context** (`disableMultimodalAnalysis`): every
 *   audio/image/video already in the context is supported by the active model,
 *   so the fallback `analyzeMedia` API must not compete with native input.
 *
 * The resolver returns a trimmed manifest (not `null`) so plan / todo and other
 * valid APIs remain available. It rewrites BOTH the API list and systemRole in
 * step so the prompt never references a tool hidden from the model.
 */
export const resolveLobeAgentManifest: BuiltinManifestResolver = (context) => {
  const inGroup = context.scope === 'group' || context.scope === 'group_agent';
  const hideSubAgentDispatch = inGroup || context.isSubAgent === true;
  const hideMultimodalAnalysis = context.disableMultimodalAnalysis === true;

  if (!hideSubAgentDispatch && !hideMultimodalAnalysis) return LobeAgentManifest;

  const hiddenApiNames = new Set<LobeAgentApiName>();
  if (hideSubAgentDispatch) hiddenApiNames.add(LobeAgentApiName.callSubAgent);
  if (hideMultimodalAnalysis) hiddenApiNames.add(LobeAgentApiName.analyzeMedia);

  const systemRole = hideSubAgentDispatch
    ? hideMultimodalAnalysis
      ? systemPromptWithoutSubAgentAndMultimodalAnalysis
      : systemPromptWithoutSubAgent
    : systemPromptWithoutMultimodalAnalysis;

  return {
    ...LobeAgentManifest,
    api: LobeAgentManifest.api.filter((api) => !hiddenApiNames.has(api.name as LobeAgentApiName)),
    systemRole,
  };
};
