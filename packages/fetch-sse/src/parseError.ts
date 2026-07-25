import type { ChatMessageError, ErrorResponse, ErrorType } from '@lobechat/types';
import { t } from 'i18next';

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
      message:
        (shouldPreferBodyMessage ? bodyMessage : undefined) ||
        getTranslatedMessage(`response.${errorType}`) ||
        bodyMessage ||
        extractErrorMessage(data) ||
        getTranslatedMessage(`response.${response.status}`) ||
        `Request failed (${response.status})`,
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
