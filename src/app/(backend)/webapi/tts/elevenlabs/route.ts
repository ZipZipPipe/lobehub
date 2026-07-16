import { checkAuth } from '@/app/(backend)/middleware/auth';
import { createSpeechResponse } from '@/server/utils/createSpeechResponse';

const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1/text-to-speech';

/**
 * Shape sent by `useOpenAITTS` (`@lobehub/tts/react`) when a `serviceUrl` is
 * configured: the OpenAITTSPayload is forwarded verbatim, with `model` and
 * `voice` nested under `options` — not flattened.
 */
interface ElevenLabsTTSPayload {
  input: string;
  options?: {
    model?: string;
    voice?: string;
  };
}

export const POST = checkAuth(async (req: Request) => {
  const payload = (await req.json()) as ElevenLabsTTSPayload;

  const voiceId = payload.options?.voice;
  if (!voiceId) {
    return new Response(
      JSON.stringify({ error: 'Missing ElevenLabs voice id in payload options.' }),
      { headers: { 'Content-Type': 'application/json' }, status: 400 },
    );
  }

  // Resolve API key: env var first, then the provider-specific header.
  const apiKey = process.env.ELEVENLABS_API_KEY || req.headers.get('x-elevenlabs-api-key') || '';

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'Missing ElevenLabs API key. Set ELEVENLABS_API_KEY env var.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Map OpenAI-style model names to ElevenLabs model IDs
  const modelIdMap: Record<string, string> = {
    'eleven_v3': 'eleven_v3',
    'eleven_multilingual_v2': 'eleven_multilingual_v2',
    'eleven_turbo_v2_5': 'eleven_turbo_v2_5',
    'eleven_flash_v2_5': 'eleven_flash_v2_5',
    'tts-1': 'eleven_turbo_v2_5',
    'tts-1-hd': 'eleven_multilingual_v2',
    'gpt-4o-mini-tts': 'eleven_multilingual_v2',
  };
  const modelId = modelIdMap[payload.options?.model ?? ''] || 'eleven_v3';

  const elevenLabsBody = {
    model_id: modelId,
    text: payload.input,
    voice_settings: {
      similarity_boost: 0.75,
      stability: 0.5,
      style: 0,
      use_speaker_boost: true,
    },
  };

  return createSpeechResponse(
    async () => {
      const response = await fetch(`${ELEVENLABS_BASE}/${voiceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify(elevenLabsBody),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`ElevenLabs API error ${response.status}: ${errText}`);
      }

      return response;
    },
    {
      logTag: 'webapi/tts/elevenlabs',
      messages: {
        failure: 'Failed to synthesize speech via ElevenLabs',
        invalid: 'Unexpected response from ElevenLabs API',
      },
    },
  );
});
