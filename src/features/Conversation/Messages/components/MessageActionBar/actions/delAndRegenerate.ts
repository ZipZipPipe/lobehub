import { ListRestart } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { messageStateSelectors, useConversationStore } from '../../../../store';
import { defineAction } from '../defineAction';

export const delAndRegenerateAction = defineAction({
  key: 'delAndRegenerate',
  useBuild: (ctx) => {
    const { t } = useTranslation('chat');
    const isRegenerating = useConversationStore(
      messageStateSelectors.isMessageRegenerating(ctx.id),
    );
    const isGenerating = useConversationStore(messageStateSelectors.isAIGenerating);
    const delAndRegenerateMessage = useConversationStore((s) => s.delAndRegenerateMessage);

    return useMemo(
      () => ({
        disabled: isGenerating || isRegenerating,
        handleClick: () => delAndRegenerateMessage(ctx.id),
        icon: ListRestart,
        key: 'delAndRegenerate',
        label: t('messageAction.delAndRegenerate'),
      }),
      [t, ctx.id, isGenerating, isRegenerating, delAndRegenerateMessage],
    );
  },
});
