import { getRuntimeErrorI18nKey } from '@lobechat/model-runtime/errors';
import type { ChatMessageError, ErrorResponse, ErrorType } from '@lobechat/types';
import { isRecord, pickTrimmedString } from '@lobechat/utils';
import i18next, { t } from 'i18next';
import { getProviderDisplayName } from 'model-bank/modelProviders';

/**
 * Runtime error codes live in their own `modelRuntime` namespace while HTTP
 * statuses and app-only codes stay under the legacy `error:response.<X>` map;
 * `getRuntimeErrorI18nKey` owns that routing (and alias canonicalisation).
 * Looking a runtime code up in the wrong place makes i18next echo the key back,
 * which is how users ended up seeing raw `response.InvalidProviderAPIKey` text
 * in the "fetch model list" toast.
 */
const translateErrorType = (errorType: ErrorResponse['errorType'], body: unknown) => {
  const { key, ns } = getRuntimeErrorI18nKey(errorType);

  // Both namespaces interpolate `{{provider}}`; the backend puts the provider
  // **id** on the error body, so resolve it to the display name the same way
  // `useProviderName` does — otherwise the toast reads "meta" instead of "Meta".
  const providerId = isRecord(body) ? pickTrimmedString(body.provider) : undefined;
  const provider = providerId ? getProviderDisplayName(providerId) : '';

  // A registered code with no locale entry yet (e.g. `NoAvailableProvider`) must
  // not surface as the bare code: prefer the backend's own message, then the
  // generic fetch-error copy, mirroring the connection checker's fallback chain.
  const defaultValue =
    (isRecord(body) ? pickTrimmedString(body.message) : pickTrimmedString(body)) ??
    t('response.UnknownChatFetchError', { ns: 'error' });

  return t(key, { defaultValue, ns, provider });
};

/**
 * Namespaces are lazy-loaded per route, and this runs outside React so no
 * `useTranslation` has pulled them in. Without an explicit load, `t` echoes the
 * key back and the UI shows a raw error code.
 */
const ensureNamespaces = async () => {
  try {
    await i18next.loadNamespaces(['error', 'modelRuntime']);
  } catch {
    // a failed namespace load must not swallow the error we came here to report
  }
};

const pickString = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

const extractErrorMessage = (value: unknown): string | undefined => {
  const directMessage = pickString(value);
  if (directMessage) return directMessage;

  if (!value || typeof value !== 'object') return;

  if (value instanceof Error) return pickString(value.message);

  const record = value as Record<string, unknown>;
  for (const key of ['message', 'error_description', 'detail', 'title', 'reason']) {
    const message = pickString(record[key]);
    if (message) return message;
  }

  return extractErrorMessage(record.error) || extractErrorMessage(record.body);
};

const getTranslatedMessage = (key: string) => {
  const message = t(key, { ns: 'error' });
  return message && message !== key ? message : undefined;
};

export const getMessageError = async (response: Response): Promise<ChatMessageError> => {
  let chatMessageError: ChatMessageError;

  await ensureNamespaces();

  // try to get the biz error
  try {
    const data = (await response.json()) as ErrorResponse;
    const body = data.body ?? data;
    const errorType = data.errorType ?? (response.status as ErrorType);
    const bodyMessage = extractErrorMessage(body);
    const hasNamedBusinessErrorType =
      typeof data.errorType === 'string' && Boolean(data.errorType.trim());
    const shouldPreferBodyMessage = Boolean(bodyMessage) && !hasNamedBusinessErrorType;

    chatMessageError = {
      body,
      message: shouldPreferBodyMessage ? bodyMessage : translateErrorType(errorType, body),
      type: errorType,
    };
  } catch {
    // if not return, then it's a common error
    chatMessageError = {
      message:
        getTranslatedMessage(`response.${response.status}`) ||
        `Request failed (${response.status})`,
      type: response.status as ErrorType,
    };
  }

  return chatMessageError;
};
