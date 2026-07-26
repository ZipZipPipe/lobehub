import type { BuiltinManifestResolver } from '@lobechat/types';

import { LobeAgentManifest } from './manifest';
import {
  systemPromptWithoutSubAgent,
  systemPromptWithoutSubAgentAndVisualAnalysis,
  systemPromptWithoutVisualAnalysis,
} from './systemRole';
import { LobeAgentApiName } from './types';

/**
 * Context-aware manifest for the lobe-agent tool.
 *
 * `lobe-agent` bundles plan / todo / visual-media APIs together with the
 * `callSubAgent` dispatch. Individual APIs are hidden in these contexts:
 *
 * - **Inside a group** (`scope` is `group` / `group_agent`): coordination already
 *   happens through real member agents via GroupManagement; an isolated ad-hoc
 *   sub-agent on top of that is redundant and confusing.
 * - **Inside a sub-agent** (`isSubAgent`): a nested sub-agent must not spawn
 *   further sub-agents.
 * - **Native visual context** (`disableVisualAnalysis`): every image/video
 *   already in the context is supported by the active model, so the fallback
 *   `analyzeVisualMedia` API must not compete with native multimodal input.
 *
 * The resolver returns a trimmed manifest (not `null`) so plan / todo and other
 * valid APIs remain available. It rewrites BOTH the API list and systemRole in
 * step so the prompt never references a tool hidden from the model.
 */
export const resolveLobeAgentManifest: BuiltinManifestResolver = (context) => {
  const inGroup = context.scope === 'group' || context.scope === 'group_agent';
  const hideSubAgentDispatch = inGroup || context.isSubAgent === true;
  const hideVisualAnalysis = context.disableVisualAnalysis === true;

  if (!hideSubAgentDispatch && !hideVisualAnalysis) return LobeAgentManifest;

  const hiddenApiNames = new Set<LobeAgentApiName>();
  if (hideSubAgentDispatch) hiddenApiNames.add(LobeAgentApiName.callSubAgent);
  if (hideVisualAnalysis) hiddenApiNames.add(LobeAgentApiName.analyzeVisualMedia);

  const systemRole = hideSubAgentDispatch
    ? hideVisualAnalysis
      ? systemPromptWithoutSubAgentAndVisualAnalysis
      : systemPromptWithoutSubAgent
    : systemPromptWithoutVisualAnalysis;

  return {
    ...LobeAgentManifest,
    api: LobeAgentManifest.api.filter((api) => !hiddenApiNames.has(api.name as LobeAgentApiName)),
    systemRole,
  };
};
