export type STTServer = 'openai' | 'browser';

export interface UserTTSConfig {
  openAI: {
    sttModel: string;
    ttsModel: string;
  };
  sttAutoStop: boolean;
  sttServer: STTServer;
}
