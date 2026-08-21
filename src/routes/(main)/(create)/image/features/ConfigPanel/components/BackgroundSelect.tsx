import { Select } from '@lobehub/ui/base-ui';
import { useTranslation } from 'react-i18next';

import { useGenerationConfigParam } from '@/store/image/slices/generationConfig/hooks';

const BackgroundSelect = () => {
  const { t } = useTranslation('image');
  const { value, setValue, enumValues } = useGenerationConfigParam('background');

  const options =
    enumValues?.map((background) => ({
      label: t(`config.background.options.${background}` as any),
      value: background,
    })) ?? [];

  return <Select options={options} style={{ width: '100%' }} value={value} onChange={setValue} />;
};

export default BackgroundSelect;
