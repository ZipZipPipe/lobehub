import { Select } from '@lobehub/ui/base-ui';
import { useTranslation } from 'react-i18next';

import { useGenerationConfigParam } from '@/store/image/slices/generationConfig/hooks';

const ModerationSelect = () => {
  const { t } = useTranslation('image');
  const { value, setValue, enumValues } = useGenerationConfigParam('moderation');

  const options =
    enumValues?.map((moderation) => ({
      label: t(`config.moderation.options.${moderation}` as any),
      value: moderation,
    })) ?? [];

  return <Select options={options} style={{ width: '100%' }} value={value} onChange={setValue} />;
};

export default ModerationSelect;
