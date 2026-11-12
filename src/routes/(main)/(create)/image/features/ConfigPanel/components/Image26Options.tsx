import { Flexbox, Input, InputNumber, Select, Switch, Text } from '@lobehub/ui';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { useGenerationConfigParam } from '@/store/image/slices/generationConfig/hooks';

import ImageUpload from './ImageUpload';

const Field = ({ children, label }: { children: ReactNode; label: string }) => (
  <Flexbox gap={6}>
    <Text fontSize={12}>{label}</Text>
    {children}
  </Flexbox>
);

export const Image26Options = ({ hasReferenceImages }: { hasReferenceImages: boolean }) => {
  const { t } = useTranslation('image');
  const complexity = useGenerationConfigParam('complexity');
  const format = useGenerationConfigParam('outputFormat');
  const svgModel = useGenerationConfigParam('svgModel');
  const effort = useGenerationConfigParam('svgReasoningEffort');
  const stream = useGenerationConfigParam('stream');
  const partial = useGenerationConfigParam('partialImages');
  const safety = useGenerationConfigParam('safetyIdentifier');
  const mask = useGenerationConfigParam('maskUrl');
  const markup = useGenerationConfigParam('markupUrl');
  const raster = format.value !== 'gif' && format.value !== 'svg';

  return (
    <Flexbox gap={12}>
      <Field label={t('config.complexity.label')}>
        <Select
          aria-label={t('config.complexity.label')}
          style={{ width: '100%' }}
          value={complexity.value}
          options={complexity.enumValues?.map((value) => ({
            label: t(`config.quality.options.${value}` as any),
            value,
          }))}
          onChange={complexity.setValue}
        />
      </Field>
      {format.value === 'svg' && (
        <>
          <Field label={t('config.svgModel.label')}>
            <Input
              aria-label={t('config.svgModel.label')}
              placeholder={t('config.svgModel.placeholder')}
              value={svgModel.value}
              onChange={(event) => svgModel.setValue(event.target.value)}
            />
            <Text fontSize={12} type="secondary">
              {t('config.svgModel.hint')}
            </Text>
          </Field>
          {svgModel.value?.trim() && (
            <Field label={t('config.svgReasoningEffort.label')}>
              <Select
                aria-label={t('config.svgReasoningEffort.label')}
                style={{ width: '100%' }}
                value={effort.value}
                options={effort.enumValues?.map((value) => ({
                  label: value === 'auto' ? t('config.background.options.auto') : value,
                  value,
                }))}
                onChange={effort.setValue}
              />
            </Field>
          )}
        </>
      )}
      <details>
        <summary style={{ cursor: 'pointer' }}>{t('config.advanced.label')}</summary>
        <Flexbox gap={12} paddingBlock={12}>
          {raster && (
            <>
              <Flexbox horizontal align="center" justify="space-between">
                <Text fontSize={12}>{t('config.stream.label')}</Text>
                <Switch
                  aria-label={t('config.stream.label')}
                  checked={!!stream.value}
                  onChange={stream.setValue}
                />
              </Flexbox>
              {stream.value && (
                <Field label={t('config.partialImages.label')}>
                  <InputNumber
                    aria-label={t('config.partialImages.label')}
                    max={partial.max}
                    min={partial.min}
                    step={partial.step}
                    value={partial.value}
                    onChange={(value) => partial.setValue(typeof value === 'number' ? value : 0)}
                  />
                  <Text fontSize={12} type="secondary">
                    {t('config.stream.hint')}
                  </Text>
                </Field>
              )}
            </>
          )}
          <Field label={t('config.safetyIdentifier.label')}>
            <Input
              aria-label={t('config.safetyIdentifier.label')}
              maxLength={128}
              placeholder={t('config.safetyIdentifier.placeholder')}
              value={safety.value}
              onChange={(event) => safety.setValue(event.target.value)}
            />
          </Field>
          {hasReferenceImages && format.value !== 'svg' && (
            <>
              <Text fontSize={12} type="secondary">
                {t('config.editOverlay.hint')}
              </Text>
              {format.value !== 'gif' && (
                <Field label={t('config.mask.label')}>
                  <ImageUpload
                    maxFileSize={4 * 1024 * 1024}
                    placeholderHeight={80}
                    value={mask.value}
                    onChange={(value) => {
                      mask.setValue(typeof value === 'string' ? value : (value?.url ?? ''));
                      if (value) markup.setValue('');
                    }}
                  />
                </Field>
              )}
              <Field label={t('config.markup.label')}>
                <ImageUpload
                  maxFileSize={50 * 1024 * 1024}
                  placeholderHeight={80}
                  value={markup.value}
                  onChange={(value) => {
                    markup.setValue(typeof value === 'string' ? value : (value?.url ?? ''));
                    if (value) mask.setValue('');
                  }}
                />
              </Field>
            </>
          )}
        </Flexbox>
      </details>
    </Flexbox>
  );
};
