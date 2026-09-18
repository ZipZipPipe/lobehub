import { Select } from '@lobehub/ui/base-ui';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useGenerationConfigParam } from '@/store/image/slices/generationConfig/hooks';

const QUALITY_LABEL_KEYS = {
  auto: 'config.quality.options.auto',
  hd: 'config.quality.options.hd',
  high: 'config.quality.options.high',
  low: 'config.quality.options.low',
  max: 'config.quality.options.max',
  medium: 'config.quality.options.medium',
  standard: 'config.quality.options.standard',
  xhigh: 'config.quality.options.xhigh',
} as const;

const QualitySelect = memo(() => {
  const { t } = useTranslation('image');
  const { value, setValue, enumValues } = useGenerationConfigParam('quality');

  const options =
    enumValues?.map((quality) => {
      const labelKey = QUALITY_LABEL_KEYS[quality as keyof typeof QUALITY_LABEL_KEYS];
      return { label: labelKey ? t(labelKey) : quality, value: quality };
    }) ?? [];

  return <Select options={options} style={{ width: '100%' }} value={value} onChange={setValue} />;
});

export default QualitySelect;
