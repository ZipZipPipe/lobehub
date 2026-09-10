import { Select } from '@lobehub/ui/base-ui';
import { useTranslation } from 'react-i18next';

import { useGenerationConfigParam } from '@/store/image/slices/generationConfig/hooks';

const OutputFormatSelect = () => {
  const { t } = useTranslation('image');
  const { value: background } = useGenerationConfigParam('background');
  const { value, setValue, enumValues } = useGenerationConfigParam('outputFormat');

  const options =
    enumValues?.map((format) => ({
      disabled: background === 'transparent' && format === 'jpeg',
      label: t(`config.outputFormat.options.${format}` as any),
      value: format,
    })) ?? [];

  return <Select options={options} style={{ width: '100%' }} value={value} onChange={setValue} />;
};

export default OutputFormatSelect;
