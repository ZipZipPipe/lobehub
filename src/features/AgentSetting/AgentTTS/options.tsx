import { Azure, OpenAI } from '@lobehub/icons';
import { type SelectProps } from '@lobehub/ui/base-ui';

import { LabelRenderer } from '@/components/ModelSelect';

const ElevenLabsAvatar = () => (
  <div
    style={{
      alignItems: 'center',
      background: 'linear-gradient(135deg, #000 0%, #333 100%)',
      borderRadius: '50%',
      color: '#fff',
      display: 'flex',
      fontSize: 12,
      fontWeight: 700,
      height: 24,
      justifyContent: 'center',
      width: 24,
    }}
  >
    E
  </div>
);

export const ttsOptions: SelectProps['options'] = [
  {
    label: <LabelRenderer Icon={OpenAI.Avatar} label={'OpenAI'} />,
    value: 'openai',
  },
  {
    label: <LabelRenderer Icon={Azure.Avatar} label={'Edge Speech'} />,
    value: 'edge',
  },
  {
    label: <LabelRenderer Icon={Azure.Avatar} label={'Microsoft Speech'} />,
    value: 'microsoft',
  },
  {
    label: <LabelRenderer Icon={ElevenLabsAvatar} label={'ElevenLabs'} />,
    value: 'elevenlabs',
  },
];
