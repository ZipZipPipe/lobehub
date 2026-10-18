'use client';

import { VoiceList } from '@lobehub/tts';
import { Select, Switch } from '@lobehub/ui';
import { Form, type FormGroupItem, useForm, useWatch } from '@lobehub/ui/form';
import isEqual from 'fast-deep-equal';
import { Mic } from 'lucide-react';
import { memo, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { FORM_STYLE } from '@/const/layoutTokens';
import { useGlobalStore } from '@/store/global';
import { globalGeneralSelectors } from '@/store/global/selectors';

import { selectors, useStore } from '../store';
import { ttsOptions } from './options';
import SelectWithTTSPreview from './SelectWithTTSPreview';

const DEFAULT_ELEVENLABS_VOICE = 'OEyxkK9dZHAF59ZRc5c2';

const elevenLabsVoiceOptions = [
  { label: 'Custom (OEyxkK9dZ)', value: DEFAULT_ELEVENLABS_VOICE },
  { label: 'Rachel', value: '21m00Tcm4TlvDq8ikWAM' },
  { label: 'Domi', value: 'AZnzlk1XvdvUeBnXlLWX' },
  { label: 'Bella', value: 'EXAVITQu4vr4xnSDxMaL' },
  { label: 'Antoni', value: 'ErXwobaYiN019PkySvjV' },
  { label: 'Elli', value: 'MF3mGyEYCl7XYWbV9V6O' },
  { label: 'Josh', value: 'TxGEqnHWrfWFTfGW9XjX' },
  { label: 'Arnold', value: 'VR6AewLTigWN4FDYWX9J' },
  { label: 'Adam', value: 'pNInz6obpgDQGcFmaJgB' },
  { label: 'Sam', value: 'yoZ06aMxZJJ28mfd3POQ' },
];

const TTS_SETTING_KEY = 'tts';
const { openaiVoiceOptions } = VoiceList;

const AgentTTS = memo(() => {
  const { t } = useTranslation('setting');
  const locale = useGlobalStore(globalGeneralSelectors.currentLanguage);
  const config = useStore(selectors.currentTtsConfig, isEqual);
  const [disabled, updateConfig] = useStore((s) => [s.disabled, s.setAgentConfig]);
  const form = useForm({
    initialValues: { [TTS_SETTING_KEY]: config },
    values: { [TTS_SETTING_KEY]: config },
    onSubmit: (values) => {
      if (!disabled) updateConfig(values);
    },
  });
  const selectedTTSService = useWatch(form, 'tts.ttsService') ?? config.ttsService;
  const showAllLocaleVoice = useWatch(form, 'tts.showAllLocaleVoice') ?? config.showAllLocaleVoice;
  const selectedElevenLabsVoice = useWatch(form, 'tts.voice.elevenlabs');

  const { edgeVoiceOptions, microsoftVoiceOptions } = useMemo(
    () => new VoiceList(showAllLocaleVoice ? undefined : locale),
    [locale, showAllLocaleVoice],
  );

  useEffect(() => {
    if (selectedTTSService !== 'elevenlabs' || selectedElevenLabsVoice) return;

    form.setValue('tts.voice.elevenlabs', DEFAULT_ELEVENLABS_VOICE);
  }, [form, selectedElevenLabsVoice, selectedTTSService]);

  const tts: FormGroupItem = {
    children: [
      {
        children: <Select disabled={disabled} options={ttsOptions} />,
        desc: t('settingTTS.ttsService.desc'),
        label: t('settingTTS.ttsService.title'),
        name: 'tts.ttsService',
      },
      {
        children: <Switch disabled={disabled} />,
        desc: t('settingTTS.showAllLocaleVoice.desc'),
        hidden: selectedTTSService === 'openai' || selectedTTSService === 'elevenlabs',
        label: t('settingTTS.showAllLocaleVoice.title'),
        layout: 'horizontal',
        minWidth: undefined,
        name: 'tts.showAllLocaleVoice',
      },
      {
        children: (
          <SelectWithTTSPreview
            disabled={disabled}
            options={openaiVoiceOptions}
            server={'openai'}
          />
        ),
        desc: t('settingTTS.voice.desc'),
        hidden: selectedTTSService !== 'openai',
        label: t('settingTTS.voice.title'),
        name: 'tts.voice.openai',
      },
      {
        children: (
          <SelectWithTTSPreview disabled={disabled} options={edgeVoiceOptions} server={'edge'} />
        ),
        desc: t('settingTTS.voice.desc'),
        divider: false,
        hidden: selectedTTSService !== 'edge',
        label: t('settingTTS.voice.title'),
        name: 'tts.voice.edge',
      },
      {
        children: (
          <SelectWithTTSPreview
            disabled={disabled}
            options={microsoftVoiceOptions}
            server={'microsoft'}
          />
        ),
        desc: t('settingTTS.voice.desc'),
        divider: false,
        hidden: selectedTTSService !== 'microsoft',
        label: t('settingTTS.voice.title'),
        name: 'tts.voice.microsoft',
      },
      {
        children: (
          <SelectWithTTSPreview
            disabled={disabled}
            options={elevenLabsVoiceOptions}
            server={'elevenlabs'}
          />
        ),
        desc: t('settingTTS.voice.desc'),
        divider: false,
        hidden: selectedTTSService !== 'elevenlabs',
        label: t('settingTTS.voice.title'),
        name: 'tts.voice.elevenlabs',
      },
    ],
    icon: Mic,
    title: t('settingTTS.title'),
  };

  return (
    <Form
      aria-disabled={disabled}
      footer={<Form.SubmitFooter />}
      form={form}
      items={[tts]}
      itemsType={'group'}
      variant={'borderless'}
      {...FORM_STYLE}
    />
  );
});

export default AgentTTS;
