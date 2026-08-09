import type { ClientOptions } from '@anthropic-ai/sdk';
import OpenAI, { toFile } from 'openai';

import type { OpenAIChatMessage } from '../../types';

const DEFAULT_KIMI_CODING_BASE_URL = 'https://api.kimi.com/coding';
const KIMI_VIDEO_MAX_BYTES = 100 * 1024 * 1024;
const KIMI_VIDEO_TRANSFER_TIMEOUT_MS = 120_000;
const KIMI_VIDEO_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const KIMI_VIDEO_CACHE_MAX_ENTRIES = 256;

interface VideoReferenceCacheEntry {
  expiresAt: number;
  reference: Promise<string>;
}

const videoReferenceCache = new Map<string, VideoReferenceCacheEntry>();

const normalizeKimiCodingBaseURL = (baseURL?: string) => {
  const normalized = (baseURL || DEFAULT_KIMI_CODING_BASE_URL).replace(/\/+$/, '');

  return normalized.replace(/\/v1(?:\/messages)?\/?$/, '');
};

export const resolveKimiCodingFilesBaseURL = (baseURL?: string) =>
  `${normalizeKimiCodingBaseURL(baseURL)}/v1`;

const normalizeVideoURLForCache = (url: string) => {
  const parsed = new URL(url);
  const stableSearchParams = new URLSearchParams();

  for (const [key, value] of parsed.searchParams) {
    if (key.toLowerCase().startsWith('x-amz-') || key.toLowerCase() === 'x-id') {
      continue;
    }

    stableSearchParams.append(key, value);
  }

  stableSearchParams.sort();
  parsed.search = stableSearchParams.toString();
  parsed.hash = '';

  return parsed.toString();
};

const sha256 = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));

  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const createVideoReferenceCacheKey = async (apiKey: string, baseURL: string, url: string) =>
  sha256(`${apiKey}\0${baseURL}\0${normalizeVideoURLForCache(url)}`);

const pruneVideoReferenceCache = (now: number) => {
  for (const [key, entry] of videoReferenceCache) {
    if (entry.expiresAt <= now) videoReferenceCache.delete(key);
  }

  while (videoReferenceCache.size >= KIMI_VIDEO_CACHE_MAX_ENTRIES) {
    const oldestKey = videoReferenceCache.keys().next().value;
    if (!oldestKey) break;
    videoReferenceCache.delete(oldestKey);
  }
};

const parseContentLength = (value: string | null) => {
  if (!value || !/^\d+$/.test(value.trim())) return undefined;

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
};

const readResponseWithLimit = async (response: Response) => {
  const declaredLength = parseContentLength(response.headers.get('content-length'));
  if (declaredLength && declaredLength > KIMI_VIDEO_MAX_BYTES) {
    throw new Error(`Kimi video input exceeds the 100 MB limit (${declaredLength} bytes received)`);
  }

  if (!response.body) {
    const data = new Uint8Array(await response.arrayBuffer());
    if (data.byteLength > KIMI_VIDEO_MAX_BYTES) {
      throw new Error(
        `Kimi video input exceeds the 100 MB limit (${data.byteLength} bytes received)`,
      );
    }

    return data;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      totalBytes += value.byteLength;
      if (totalBytes > KIMI_VIDEO_MAX_BYTES) {
        await reader.cancel();
        throw new Error(`Kimi video input exceeds the 100 MB limit (${totalBytes} bytes received)`);
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const data = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    data.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return data;
};

const getVideoFilename = (url: string, mimeType: string) => {
  const extensionByMimeType: Record<string, string> = {
    'video/3gpp': '3gp',
    'video/avi': 'avi',
    'video/mp4': 'mp4',
    'video/mpeg': 'mpeg',
    'video/quicktime': 'mov',
    'video/webm': 'webm',
    'video/wmv': 'wmv',
    'video/x-flv': 'flv',
    'video/x-matroska': 'mkv',
    'video/x-msvideo': 'avi',
  };
  const fallbackExtension = extensionByMimeType[mimeType] || 'bin';

  try {
    const pathname = new URL(url).pathname;
    const name = decodeURIComponent(pathname.slice(pathname.lastIndexOf('/') + 1))
      .replaceAll(/[^\w.-]/g, '_')
      .slice(-160);

    if (name && name.includes('.')) return name;
  } catch {
    // URL validity is checked before this helper is called. Keep a safe fallback filename.
  }

  return `video.${fallbackExtension}`;
};

const downloadVideo = async (url: string) => {
  const signal = AbortSignal.timeout(KIMI_VIDEO_TRANSFER_TIMEOUT_MS);
  const response =
    typeof window === 'undefined'
      ? await import('@lobechat/ssrf-safe-fetch').then((module) =>
          module.ssrfSafeFetch(url, { signal }),
        )
      : await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`Failed to fetch Kimi video input: ${response.status} ${response.statusText}`);
  }

  const mimeType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!mimeType.startsWith('video/')) {
    throw new Error(
      `Kimi video URL returned an unsupported content type: ${mimeType || 'unknown'}`,
    );
  }

  return {
    data: await readResponseWithLimit(response),
    mimeType,
  };
};

const uploadVideoToKimi = async ({
  apiKey,
  baseURL,
  data,
  defaultHeaders,
  filename,
  mimeType,
}: {
  apiKey: string;
  baseURL: string;
  data: Uint8Array;
  defaultHeaders?: ClientOptions['defaultHeaders'];
  filename: string;
  mimeType: string;
}) => {
  const client = new OpenAI({
    apiKey,
    baseURL: resolveKimiCodingFilesBaseURL(baseURL),
    defaultHeaders: defaultHeaders as Record<string, string> | undefined,
  });
  const file = await toFile(data, filename, { type: mimeType });
  const uploaded = await client.files.create(
    {
      file,
      purpose: 'video' as any,
    },
    { signal: AbortSignal.timeout(KIMI_VIDEO_TRANSFER_TIMEOUT_MS) },
  );

  return `ms://${uploaded.id}`;
};

const createKimiVideoReference = async (url: string, options: ClientOptions): Promise<string> => {
  if (typeof options.apiKey !== 'string' || !options.apiKey.trim()) {
    throw new Error('Kimi Coding Plan API key is required to upload video input');
  }

  const baseURL = normalizeKimiCodingBaseURL(options.baseURL);
  const { data, mimeType } = await downloadVideo(url);

  try {
    return await uploadVideoToKimi({
      apiKey: options.apiKey.trim(),
      baseURL,
      data,
      defaultHeaders: options.defaultHeaders,
      filename: getVideoFilename(url, mimeType),
      mimeType,
    });
  } catch (error) {
    console.warn(
      'Kimi Coding Plan video upload failed; falling back to inline video data:',
      error instanceof Error ? error.message : String(error),
    );

    return `data:${mimeType};base64,${Buffer.from(data).toString('base64')}`;
  }
};

const resolveExternalKimiVideoReference = async (url: string, options: ClientOptions) => {
  if (typeof options.apiKey !== 'string' || !options.apiKey.trim()) {
    throw new Error('Kimi Coding Plan API key is required to upload video input');
  }

  const baseURL = normalizeKimiCodingBaseURL(options.baseURL);
  const cacheKey = await createVideoReferenceCacheKey(options.apiKey.trim(), baseURL, url);
  const now = Date.now();
  const cached = videoReferenceCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    videoReferenceCache.delete(cacheKey);
    videoReferenceCache.set(cacheKey, cached);
    return cached.reference;
  }

  if (cached) videoReferenceCache.delete(cacheKey);
  pruneVideoReferenceCache(now);

  const reference = createKimiVideoReference(url, options);
  const entry = { expiresAt: now + KIMI_VIDEO_CACHE_TTL_MS, reference };
  videoReferenceCache.set(cacheKey, entry);

  try {
    const resolved = await reference;
    if (!resolved.startsWith('ms://')) videoReferenceCache.delete(cacheKey);
    return resolved;
  } catch (error) {
    videoReferenceCache.delete(cacheKey);
    throw error;
  }
};

export const prepareKimiCodingPlanVideoInput = async (
  messages: ChatStreamPayloadMessages,
  options: ClientOptions,
): Promise<ChatStreamPayloadMessages> =>
  Promise.all(
    messages.map(async (message) => {
      if (!Array.isArray(message.content)) return message;

      const content = await Promise.all(
        message.content.map(async (part) => {
          if (part.type !== 'video_url') return part;

          const url = part.video_url.url;
          if (url.startsWith('data:') || url.startsWith('ms://')) return part;

          const parsed = new URL(url);
          if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return part;

          return {
            ...part,
            video_url: {
              ...part.video_url,
              url: await resolveExternalKimiVideoReference(url, options),
            },
          };
        }),
      );

      return { ...message, content };
    }),
  );

type ChatStreamPayloadMessages = OpenAIChatMessage[];

export const clearKimiVideoReferenceCache = () => videoReferenceCache.clear();
