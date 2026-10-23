'use client';

import { useTranslation } from 'react-i18next';

import { ModelAssignmentsForm } from '@/features/ServiceModel';
import SettingHeader from '@/features/Settings/features/SettingHeader';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';

import Image from '../image/features/Image';
import OpenAI from '../tts/features/OpenAI';

interface PageProps {
  hidePersonalPreferences?: boolean;
  showSettingHeader?: boolean;
}

const Page = ({ hidePersonalPreferences, showSettingHeader = true }: PageProps) => {
  const { t } = useTranslation('setting');
  const { enableSTT, showAiImage } = useServerConfigStore(featureFlagsSelectors);
  return (
    <>
      {showSettingHeader && <SettingHeader title={t('tab.serviceModel')} />}
      <ModelAssignmentsForm hidePersonalPreferences={hidePersonalPreferences} />
      {enableSTT && <OpenAI />}
      {showAiImage && <Image />}
    </>
  );
};

export default Page;
