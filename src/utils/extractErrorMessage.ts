const pickString = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

export const extractErrorMessage = (value: unknown): string | undefined => {
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

export const normalizeErrorBody = (value: unknown) => {
  if (!value) return undefined;
  if (value instanceof Error) {
    return {
      message: value.message,
      name: value.name,
    };
  }

  if (typeof value !== 'object') return value;

  const record = value as Record<string, unknown>;
  if (Object.keys(record).length > 0) return value;

  const message = extractErrorMessage(value);
  return message ? { message } : undefined;
};
