import { Azure, OpenAI } from '@lobehub/icons';
import { type SelectProps } from '@lobehub/ui';
import { AudioLines } from 'lucide-react';

import { LabelRenderer } from '@/components/ModelSelect';

const ElevenLabsAvatar = () => (
  <div style={{
    width: 24, height: 24, borderRadius: '50%',
    background: 'linear-gradient(135deg, #000 0%, #333 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: 12, fontWeight: 700,
  }}>E</div>
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
