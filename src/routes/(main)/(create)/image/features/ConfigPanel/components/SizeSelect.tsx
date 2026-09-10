import { Flexbox, InputNumber } from '@lobehub/ui';
import { ActionIcon, Button, Text } from '@lobehub/ui/base-ui';
import { Check, Plus, X } from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useGenerationConfigParam } from '@/store/image/slices/generationConfig/hooks';

import Select from './Select';

interface CustomSizeConstraints {
  aspectRatioMax: number;
  aspectRatioMin: number;
  maxEdge: number;
  maxPixels: number;
  minPixels: number;
  step: number;
}

export const isValidCustomSize = (
  width: number | null,
  height: number | null,
  constraints: CustomSizeConstraints,
) => {
  if (!width || !height || !Number.isInteger(width) || !Number.isInteger(height)) return false;

  const pixels = width * height;
  const aspectRatio = width / height;

  return (
    width <= constraints.maxEdge &&
    height <= constraints.maxEdge &&
    width % constraints.step === 0 &&
    height % constraints.step === 0 &&
    aspectRatio >= constraints.aspectRatioMin &&
    aspectRatio <= constraints.aspectRatioMax &&
    pixels >= constraints.minPixels &&
    pixels <= constraints.maxPixels
  );
};

const parseSize = (size: string | undefined): [number, number] | undefined => {
  if (!size || size === 'auto') return;

  const [width, height] = size.split('x').map(Number);
  if (!Number.isInteger(width) || !Number.isInteger(height)) return;

  return [width, height];
};

const SizeSelect = memo(() => {
  const { t } = useTranslation('image');
  const { value, setValue, enumValues, custom } = useGenerationConfigParam('size');
  const parsedSize = parseSize(value);
  const [isEditing, setIsEditing] = useState(false);
  const [width, setWidth] = useState<number | null>(parsedSize?.[0] ?? 1024);
  const [height, setHeight] = useState<number | null>(parsedSize?.[1] ?? 1024);
  const options = enumValues!.map((size) => ({
    label: size,
    value: size,
  }));
  const constraints = custom as CustomSizeConstraints | undefined;

  if (!constraints) {
    return <Select options={options} value={value} onChange={setValue} />;
  }

  const isCustomValue = !!value && value !== 'auto' && !enumValues?.includes(value);
  const isValid = isValidCustomSize(width, height, constraints);

  const handleOpen = () => {
    const current = parseSize(value);
    setWidth(current?.[0] ?? 1024);
    setHeight(current?.[1] ?? 1024);
    setIsEditing(true);
  };

  const handleConfirm = () => {
    if (!isValid || !width || !height) return;

    setValue(`${width}x${height}`);
    setIsEditing(false);
  };

  return (
    <Flexbox gap={8}>
      <Select options={options} value={isCustomValue ? undefined : value} onChange={setValue} />
      {isEditing ? (
        <Flexbox gap={6}>
          <Flexbox horizontal align="center" gap={8}>
            <InputNumber
              aria-label={t('config.width.label')}
              max={constraints.maxEdge}
              min={constraints.step}
              placeholder={t('config.width.label')}
              step={constraints.step}
              style={{ flex: 1, width: 0 }}
              value={width}
              onChange={(next) => setWidth(typeof next === 'number' ? next : null)}
              onPressEnter={handleConfirm}
            />
            <Text type="secondary">×</Text>
            <InputNumber
              aria-label={t('config.height.label')}
              max={constraints.maxEdge}
              min={constraints.step}
              placeholder={t('config.height.label')}
              step={constraints.step}
              style={{ flex: 1, width: 0 }}
              value={height}
              onChange={(next) => setHeight(typeof next === 'number' ? next : null)}
              onPressEnter={handleConfirm}
            />
            <ActionIcon
              disabled={!isValid}
              icon={Check}
              title={t('config.size.custom.confirm')}
              variant="filled"
              onClick={handleConfirm}
            />
            <ActionIcon
              icon={X}
              title={t('config.size.custom.cancel')}
              onClick={() => setIsEditing(false)}
            />
          </Flexbox>
          {!isValid && (
            <Text fontSize={12} type="danger">
              {t('config.size.custom.error', {
                maxEdge: constraints.maxEdge,
                maxPixels: constraints.maxPixels.toLocaleString(),
                minPixels: constraints.minPixels.toLocaleString(),
                step: constraints.step,
              })}
            </Text>
          )}
        </Flexbox>
      ) : (
        <Button block icon={Plus} onClick={handleOpen}>
          {isCustomValue ? value : t('config.size.custom.label')}
        </Button>
      )}
    </Flexbox>
  );
});

export default SizeSelect;
