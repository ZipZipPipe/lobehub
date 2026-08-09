// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { OpenAIChatMessage } from '../../types';
import {
  clearKimiVideoReferenceCache,
  prepareKimiCodingPlanVideoInput,
  resolveKimiCodingFilesBaseURL,
} from './videoUpload';

const mocks = vi.hoisted(() => ({
  createFile: vi.fn(),
  openAIOptions: vi.fn(),
  ssrfSafeFetch: vi.fn(),
  toFile: vi.fn(),
}));

vi.mock('@lobechat/ssrf-safe-fetch', () => ({
  ssrfSafeFetch: mocks.ssrfSafeFetch,
}));

vi.mock('openai', () => ({
  default: class MockOpenAI {
    files = { create: mocks.createFile };

    constructor(options: unknown) {
      mocks.openAIOptions(options);
    }
  },
  toFile: mocks.toFile,
}));

const videoMessages = (url: string): OpenAIChatMessage[] => [
  {
    content: [
      { text: 'describe', type: 'text' },
      { type: 'video_url', video_url: { url } },
    ],
    role: 'user',
  },
];

const videoResponse = (data = new Uint8Array([1, 2, 3, 4])) =>
  new Response(data, {
    headers: {
      'content-length': String(data.byteLength),
      'content-type': 'video/mp4',
    },
    status: 200,
  });

beforeEach(() => {
  clearKimiVideoReferenceCache();
  mocks.ssrfSafeFetch.mockResolvedValue(videoResponse());
  mocks.toFile.mockResolvedValue({ name: 'video.mp4' });
  mocks.createFile.mockResolvedValue({ id: 'file_video_123' });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('Kimi Coding Plan video input', () => {
  it('resolves the OpenAI-compatible files endpoint from Anthropic base URLs', () => {
    expect(resolveKimiCodingFilesBaseURL()).toBe('https://api.kimi.com/coding/v1');
    expect(resolveKimiCodingFilesBaseURL('https://api.kimi.com/coding/v1/messages')).toBe(
      'https://api.kimi.com/coding/v1',
    );
  });

  it('uploads an external video and replaces it with an ms file reference', async () => {
    const result = await prepareKimiCodingPlanVideoInput(
      videoMessages('https://storage.example.com/files/demo.mp4?X-Amz-Signature=one'),
      { apiKey: 'test-key', baseURL: 'https://api.kimi.com/coding' },
    );

    expect(mocks.ssrfSafeFetch).toHaveBeenCalledOnce();
    expect(mocks.toFile).toHaveBeenCalledWith(new Uint8Array([1, 2, 3, 4]), 'demo.mp4', {
      type: 'video/mp4',
    });
    expect(mocks.openAIOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: 'test-key',
        baseURL: 'https://api.kimi.com/coding/v1',
      }),
    );
    expect(mocks.createFile).toHaveBeenCalledWith(
      expect.objectContaining({ purpose: 'video' }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(result[0].content).toEqual([
      { text: 'describe', type: 'text' },
      { type: 'video_url', video_url: { url: 'ms://file_video_123' } },
    ]);
  });

  it('reuses an uploaded reference when only the S3 signature changes', async () => {
    const options = { apiKey: 'test-key', baseURL: 'https://api.kimi.com/coding' };

    await prepareKimiCodingPlanVideoInput(
      videoMessages(
        'https://storage.example.com/files/demo.mp4?versionId=1&X-Amz-Date=first&X-Amz-Signature=one',
      ),
      options,
    );
    const result = await prepareKimiCodingPlanVideoInput(
      videoMessages(
        'https://storage.example.com/files/demo.mp4?X-Amz-Credential=next&versionId=1&X-Amz-Date=second&X-Amz-Signature=two&x-id=GetObject',
      ),
      options,
    );

    expect(mocks.ssrfSafeFetch).toHaveBeenCalledOnce();
    expect(mocks.createFile).toHaveBeenCalledOnce();
    expect(result[0].content).toEqual([
      { text: 'describe', type: 'text' },
      { type: 'video_url', video_url: { url: 'ms://file_video_123' } },
    ]);
  });

  it('falls back to inline video data when the files endpoint rejects the upload', async () => {
    mocks.createFile.mockRejectedValueOnce(new Error('files endpoint unavailable'));
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await prepareKimiCodingPlanVideoInput(
      videoMessages('https://storage.example.com/files/demo.mp4'),
      { apiKey: 'test-key', baseURL: 'https://api.kimi.com/coding' },
    );

    expect(result[0].content).toEqual([
      { text: 'describe', type: 'text' },
      {
        type: 'video_url',
        video_url: { url: 'data:video/mp4;base64,AQIDBA==' },
      },
    ]);
    expect(warning).toHaveBeenCalledOnce();
  });

  it('leaves existing Kimi file references and data URLs unchanged', async () => {
    const messages: OpenAIChatMessage[] = [
      ...videoMessages('ms://file_existing'),
      ...videoMessages('data:video/mp4;base64,AQIDBA=='),
    ];

    const result = await prepareKimiCodingPlanVideoInput(messages, {
      apiKey: 'test-key',
      baseURL: 'https://api.kimi.com/coding',
    });

    expect(result).toEqual(messages);
    expect(mocks.ssrfSafeFetch).not.toHaveBeenCalled();
    expect(mocks.createFile).not.toHaveBeenCalled();
  });

  it('rejects videos larger than 100 MB before reading the response body', async () => {
    mocks.ssrfSafeFetch.mockResolvedValueOnce(
      new Response(new Uint8Array([1]), {
        headers: {
          'content-length': String(100 * 1024 * 1024 + 1),
          'content-type': 'video/mp4',
        },
        status: 200,
      }),
    );

    await expect(
      prepareKimiCodingPlanVideoInput(
        videoMessages('https://storage.example.com/files/too-large.mp4'),
        { apiKey: 'test-key', baseURL: 'https://api.kimi.com/coding' },
      ),
    ).rejects.toThrow('exceeds the 100 MB limit');
    expect(mocks.createFile).not.toHaveBeenCalled();
  });
});
