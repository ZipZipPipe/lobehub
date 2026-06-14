// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

const createRequest = (model = 'eleven_v3') =>
  new Request('https://test.com/webapi/tts/elevenlabs', {
    body: JSON.stringify({
      input: 'Hello from ElevenLabs',
      model,
      voice: 'OEyxkK9dZHAF59ZRc5c2',
    }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('ElevenLabs TTS route', () => {
  it('requires an ElevenLabs API key', async () => {
    vi.stubEnv('ELEVENLABS_API_KEY', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(createRequest());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: 'Missing ElevenLabs API key. Set ELEVENLABS_API_KEY env var.',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns the upstream audio response and uses eleven_v3', async () => {
    vi.stubEnv('ELEVENLABS_API_KEY', 'test-api-key');
    const audio = new Uint8Array([0x49, 0x44, 0x33, 0x04]);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(audio, {
        headers: { 'Content-Type': 'audio/mpeg' },
        status: 200,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(createRequest());

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('audio/mpeg');
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(audio);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.elevenlabs.io/v1/text-to-speech/OEyxkK9dZHAF59ZRc5c2',
      expect.objectContaining({
        body: expect.any(String),
        headers: expect.objectContaining({
          'xi-api-key': 'test-api-key',
        }),
        method: 'POST',
      }),
    );

    const requestOptions = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(requestOptions.body as string)).toEqual(
      expect.objectContaining({
        model_id: 'eleven_v3',
        text: 'Hello from ElevenLabs',
      }),
    );
  });
});
