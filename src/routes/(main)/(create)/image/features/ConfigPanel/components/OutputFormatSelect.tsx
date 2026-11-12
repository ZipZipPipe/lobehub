import { Select } from '@lobehub/ui';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useImageStore } from '@/store/image';
import { useGenerationConfigParam } from '@/store/image/slices/generationConfig/hooks';

const LABELED_FORMATS = new Set(['gif', 'png']);

interface OutputFormatSelectProps {
  /**
   * SVG is generation-only, so it is unavailable while reference images are attached.
   */
  disableSvg?: boolean;
}

const OutputFormatSelect = memo<OutputFormatSelectProps>(({ disableSvg }) => {
  const { t } = useTranslation('image');
  const { value, setValue, enumValues } = useGenerationConfigParam('outputFormat');
  const setParam = useImageStore((s) => s.setParamOnInput);
  const background = useImageStore((s) => s.parameters?.background);

  const options =
    enumValues?.map((format) => {
      const disabled = format === 'svg' && disableSvg;
      const label = LABELED_FORMATS.has(format)
        ? t(`config.outputFormat.options.${format as 'gif' | 'png'}`)
        : format.toUpperCase();

      return {
        disabled,
        label: disabled ? `${label} · ${t('config.outputFormat.svgRefUnsupported')}` : label,
        value: format,
      };
    }) ?? [];

  return (
    <Select
      options={options}
      style={{ width: '100%' }}
      value={value}
      onChange={(format) => {
        setValue(format);
        if (format === 'gif' || format === 'svg') setParam('maskUrl', '');
        if (format === 'svg') setParam('markupUrl', '');
        if (background === 'transparent' && (format === 'jpeg' || format === 'gif')) {
          setParam('background', 'auto');
        }
      }}
    />
  );
});

export default OutputFormatSelect;
