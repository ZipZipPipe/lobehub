export type TTSServer = 'openai' | 'edge' | 'microsoft' | 'elevenlabs';

export interface LobeAgentTTSConfig {
  showAllLocaleVoice?: boolean;
  sttLocale: 'auto' | string;
  ttsService: TTSServer;
  voice: {
    edge?: string;
    elevenlabs?: string;
    microsoft?: string;
    openai: string;
  };
}
