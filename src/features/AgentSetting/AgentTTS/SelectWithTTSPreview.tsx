import { getMessageError } from '@lobechat/fetch-sse';
import { type ChatMessageError } from '@lobechat/types';
import { AudioPlayer } from '@lobehub/tts/react';
import { Flexbox, Highlighter } from '@lobehub/ui';
import { Alert, Button, Select, type SelectProps } from '@lobehub/ui/base-ui';
import { cssVar } from 'antd-style';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useTTS } from '@/hooks/useTTS';
import { type TTSServer } from '@/types/agent';
import { extractErrorMessage, normalizeErrorBody } from '@/utils/extractErrorMessage';

interface SelectWithTTSPreviewProps extends SelectProps<string> {
  server: TTSServer;
}

const SelectWithTTSPreview = ({
  value,
  options,
  server,
  onSelect,
  ...rest
}: SelectWithTTSPreviewProps) => {
  const [error, setError] = useState<ChatMessageError>();
  const [voice, setVoice] = useState<string>((value as string) || '');
  const { t } = useTranslation('welcome');
  const PREVIEW_TEXT = ['Lobe Chat', t('slogan.title'), t('slogan.desc1')].join('. ');

  useEffect(() => {
    setVoice((value as string) || '');
  }, [value]);

  const setDefaultError = useCallback(
    (err?: any) => {
      const fallbackMessage = t('tts.responseError', { ns: 'error' });
      setError({
        body: normalizeErrorBody(err),
        message: extractErrorMessage(err) || fallbackMessage,
        type: 500,
      });
    },
    [t],
  );

  const { isGlobalLoading, audio, stop, start, response, setText } = useTTS(PREVIEW_TEXT, {
    onError: (err) => {
      stop();
      setDefaultError(err);
    },
    onErrorRetry: (err) => {
      stop();
      setDefaultError(err);
    },
    onSuccess: async () => {
      if (!response) return;
      if (response.status === 200) return;
      const message = await getMessageError(response);
      if (message) {
        setError(message);
      } else {
        setDefaultError();
      }
      stop();
    },
    server,
    voice,
  });

  const handleCloseError = useCallback(() => {
    setError(undefined);
    stop();
  }, [stop]);

  const handleRetry = useCallback(() => {
    setError(undefined);
    stop();
    start();
  }, [stop, start]);

  const handleSelect: SelectProps['onSelect'] = (value, option) => {
    stop();
    setVoice(value as string);
    setText([PREVIEW_TEXT, option?.label].join(' - '));
    onSelect?.(value, option);
  };
  const errorMessage =
    error?.message || extractErrorMessage(error?.body) || t('tts.responseError', { ns: 'error' });

  return (
    <Flexbox gap={8}>
      <Flexbox horizontal align={'center'} gap={8} style={{ width: '100%' }}>
        <Select options={options} value={value} onSelect={handleSelect} {...rest} />
        <AudioPlayer
          buttonActive
          allowPause={false}
          audio={audio}
          buttonSize={{ blockSize: 36, size: 16 }}
          isLoading={isGlobalLoading}
          showDonload={false}
          showSlider={false}
          showTime={false}
          style={{ flex: 'none', padding: 0, width: 'unset' }}
          title={t('settingTTS.voice.preview', { ns: 'setting' })}
          buttonStyle={{
            background: cssVar.colorBgContainer,
            border: `1px solid ${cssVar.colorBorder}`,
          }}
          onInitPlay={start}
          onLoadingStop={stop}
        />
      </Flexbox>
      {error && (
        <Alert
          closable
          style={{ alignItems: 'center', width: '100%' }}
          title={errorMessage}
          type="error"
          action={
            <Button size={'small'} type={'primary'} onClick={handleRetry}>
              {t('retry', { ns: 'common' })}
            </Button>
          }
          extra={
            error.body && (
              <Highlighter actionIconSize={'small'} language={'json'} variant={'borderless'}>
                {JSON.stringify(error.body, null, 2)}
              </Highlighter>
            )
          }
          onClose={handleCloseError}
        />
      )}
    </Flexbox>
  );
};

export default SelectWithTTSPreview;
