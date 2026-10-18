import { z } from 'zod';

import { checkAuth } from '@/app/(backend)/middleware/auth';
import { initModelRuntimeFromDB } from '@/server/modules/ModelRuntime';
import { createSpeechResponse } from '@/server/utils/createSpeechResponse';

import { resolveValidWorkspaceIdFromRequest } from '../../_utils/workspace';

const payloadSchema = z.object({
  input: z.string().min(1),
  options: z.object({
    model: z.string().min(1),
    speed: z.number().min(0.25).max(4).optional(),
    voice: z.string().min(1),
  }),
});

// Keep the chat player's payload while using the same runtime as tts.synthesize.
export const POST = checkAuth(async (req, { serverDB, userId }) => {
  const payload = payloadSchema.safeParse(await req.json());
  if (!payload.success) return Response.json({ error: 'Invalid TTS payload' }, { status: 400 });

  return createSpeechResponse(
    async () => {
      const workspaceId = await resolveValidWorkspaceIdFromRequest({ req, serverDB, userId });
      const runtime = await initModelRuntimeFromDB(serverDB, userId, 'openai', workspaceId);
      const audio = await runtime.textToSpeech(
        { input: payload.data.input, ...payload.data.options },
        { signal: req.signal, user: userId },
      );
      if (!audio) return new Response('Text-to-speech is not supported', { status: 501 });

      return new Response(audio, { headers: { 'Content-Type': 'audio/mpeg' } });
    },
    { logTag: 'webapi/tts/openai' },
  );
});
