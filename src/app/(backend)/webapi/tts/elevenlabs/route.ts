import { createSpeechResponse } from '@/server/utils/createSpeechResponse';

const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1/text-to-speech';

interface ElevenLabsTTSPayload {
  input: string;
  model: string;
  voice: string;
}

export const POST = async (req: Request) => {
  const payload = (await req.json()) as ElevenLabsTTSPayload;

  // Resolve API key: env var first, then the provider-specific header.
  const apiKey =
    process.env.ELEVENLABS_API_KEY || req.headers.get('x-elevenlabs-api-key') || '';

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
  const modelId = modelIdMap[payload.model] || 'eleven_v3';

  const elevenLabsBody = {
    model_id: modelId,
    text: payload.input,
    voice_settings: {
      similarity_boost: 0.75,
      stability: 0.5,
      style: 0.0,
      use_speaker_boost: true,
    },
  };

  return createSpeechResponse(
    async () => {
      const response = await fetch(
        `${ELEVENLABS_BASE}/${payload.voice}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': apiKey,
            Accept: 'audio/mpeg',
          },
          body: JSON.stringify(elevenLabsBody),
        },
      );

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
};
