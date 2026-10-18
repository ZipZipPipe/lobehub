// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { initModelRuntimeFromDB } from '@/server/modules/ModelRuntime';

import { POST } from './route';

vi.mock('@/app/(backend)/middleware/auth', () => ({
  checkAuth: (handler: (req: Request, context: unknown) => Promise<Response>) => (req: Request) =>
    handler(req, { serverDB: 'database', userId: 'user' }),
}));
vi.mock('@/server/modules/ModelRuntime', () => ({ initModelRuntimeFromDB: vi.fn() }));
vi.mock('../../_utils/workspace', () => ({
  resolveValidWorkspaceIdFromRequest: vi.fn().mockResolvedValue('workspace'),
}));

const request = (body: unknown) =>
  new Request('https://test.com/webapi/tts/openai', {
    body: JSON.stringify(body),
    method: 'POST',
  });
const options = { params: Promise.resolve({}) };

beforeEach(() => vi.clearAllMocks());

describe('OpenAI chat TTS compatibility route', () => {
  it('passes nested player options to the user and workspace model runtime', async () => {
    const audio = new Uint8Array([73, 68, 51]).buffer;
    const textToSpeech = vi.fn().mockResolvedValue(audio);
    vi.mocked(initModelRuntimeFromDB).mockResolvedValue({ textToSpeech } as any);
    const response = await POST(
      request({ input: 'Hello', options: { model: 'tts-1', voice: 'alloy', speed: 1.25 } }),
      options,
    );

    expect(initModelRuntimeFromDB).toHaveBeenCalledWith('database', 'user', 'openai', 'workspace');
    expect(textToSpeech).toHaveBeenCalledWith(
      { input: 'Hello', model: 'tts-1', voice: 'alloy', speed: 1.25 },
      { signal: expect.any(AbortSignal), user: 'user' },
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('audio/mpeg');
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array(audio));
  });

  it('rejects the flattened payload before invoking a provider', async () => {
    const response = await POST(
      request({ input: 'Hello', model: 'tts-1', voice: 'alloy' }),
      options,
    );
    expect(response.status).toBe(400);
    expect(initModelRuntimeFromDB).not.toHaveBeenCalled();
  });

  it('reports unsupported speech instead of returning an empty successful audio file', async () => {
    vi.mocked(initModelRuntimeFromDB).mockResolvedValue({
      textToSpeech: vi.fn().mockResolvedValue(undefined),
    } as any);
    const response = await POST(
      request({ input: 'Hello', options: { model: 'tts-1', voice: 'alloy' } }),
      options,
    );
    expect(response.status).toBe(501);
  });
});
