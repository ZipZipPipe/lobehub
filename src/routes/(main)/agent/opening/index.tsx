'use client';

import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';

import AgentOpening from '@/features/AgentSetting/AgentOpening';
import AgentTTS from '@/features/AgentSetting/AgentTTS';
import AgentSettingsPage from '@/features/AgentSettingsPage';
import ResourceConfigAccessGate from '@/features/ResourcePermission/ResourceConfigAccessGate';

const AgentOpeningPage = () => {
  const { t } = useTranslation('setting');
  const { aid } = useParams<{ aid: string }>();

  return (
    <ResourceConfigAccessGate
      redirectPath={`/agent/${aid ?? ''}`}
      resourceId={aid}
      resourceType="agent"
    >
      <AgentSettingsPage title={t('agentTab.opening')}>
        <AgentOpening />
        <AgentTTS />
      </AgentSettingsPage>
    </ResourceConfigAccessGate>
  );
};

export default AgentOpeningPage;
