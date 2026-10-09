'use client';

import { Icon } from '@lobehub/ui';
import { Select, Skeleton } from '@lobehub/ui/base-ui';
import { Form, type FormGroupItem, useForm } from '@lobehub/ui/base-ui/form';
import isEqual from 'fast-deep-equal';
import { Loader2Icon } from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FORM_STYLE } from '@/const/layoutTokens';
import { SettingsSearchAnchor } from '@/features/SettingsSearch/anchor';
import { usePermission } from '@/hooks/usePermission';
import { useUserStore } from '@/store/user';
import { settingsSelectors } from '@/store/user/selectors';

import { opeanaiTTSOptions } from './const';

const OpenAI = memo(() => {
  const { t } = useTranslation('setting');
  const { allowed: canManageServiceModel, reason } = usePermission('manage_settings');
  const tts = useUserStore(settingsSelectors.currentTTS, isEqual);
  const [setSettings, isUserStateInit] = useUserStore((s) => [s.setSettings, s.isUserStateInit]);
  const [loading, setLoading] = useState(false);
  const form = useForm({
    initialValues: tts,
    values: tts,
    onValuesChange: async (values) => {
      if (!canManageServiceModel) return;

      setLoading(true);
      try {
        await setSettings({ tts: values });
      } finally {
        setLoading(false);
      }
    },
  });

  if (!isUserStateInit) return <Skeleton.Text rows={5} />;

  const openai: FormGroupItem = {
    children: [
      {
        children: (
          <Select
            disabled={!canManageServiceModel}
            options={opeanaiTTSOptions}
            style={{ width: 'min(100%, 448px)' }}
          />
        ),
        label: (
          <SettingsSearchAnchor id={'service-model-tts'}>
            {t('settingTTS.openai.ttsModel')}
          </SettingsSearchAnchor>
        ),
        name: 'openAI.ttsModel',
        tooltip: reason,
      },
    ],
    extra: loading && <Icon spin icon={Loader2Icon} size={16} style={{ opacity: 0.5 }} />,
    title: t('settingTTS.openai.title'),
  };

  return (
    <Form
      collapsible={false}
      form={form}
      items={[openai]}
      itemsType={'group'}
      variant={'filled'}
      {...FORM_STYLE}
      itemMinWidth={undefined}
    />
  );
});

export default OpenAI;
