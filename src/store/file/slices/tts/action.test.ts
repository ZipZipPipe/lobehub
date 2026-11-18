import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { createElement, type PropsWithChildren, useEffect } from 'react';
import { SWRConfig, useSWRConfig } from 'swr';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { cacheScope } from '@/libs/replica';
import { setScopedMutate } from '@/libs/swr/mutate';
import { lambdaClient } from '@/libs/trpc/client';
import { fileService } from '@/services/file';
import { createServerConfigStore } from '@/store/serverConfig/store';

import { useFileStore as useStore } from '../../store';

vi.mock('@/libs/trpc/client', () => ({
  lambdaClient: { file: { getFileItemById: { query: vi.fn() } } },
}));

const MutateBridge = () => {
  const { mutate } = useSWRConfig();
  useEffect(() => setScopedMutate(mutate), [mutate]);
  return null;
};
const wrapper = ({ children }: PropsWithChildren) =>
  createElement(
    SWRConfig,
    { value: { dedupingInterval: 0, provider: () => new Map() } },
    createElement(MutateBridge),
    children,
  );

//  mock the arrayBuffer
beforeAll(() => {
  Object.defineProperty(File.prototype, 'arrayBuffer', {
    writable: true,
    value: function () {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result);
        };
        reader.readAsArrayBuffer(this);
      });
    },
  });

  createServerConfigStore();
});

beforeEach(() => {
  // Reset all mocks before each test
  vi.resetAllMocks();
  vi.spyOn(cacheScope, 'get').mockReturnValue('tts-replica-test:personal');
  vi.spyOn(cacheScope, 'use').mockReturnValue('tts-replica-test:personal');
  vi.spyOn(cacheScope, 'canPersist').mockReturnValue(false);
  useStore.setState({ fileDetailMap: {} });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('TTSFileAction', () => {
  // Test for removeTTSFile
  it('removeTTSFile should call fileService.removeFile', async () => {
    const fileId = 'tts-file-id';

    // Mock the fileService.removeFile to resolve
    vi.spyOn(fileService, 'removeFile').mockResolvedValue(undefined);

    await act(async () => {
      await useStore.getState().removeTTSFile(fileId);
    });

    expect(fileService.removeFile).toHaveBeenCalledWith(fileId);
  });

  // Test for uploadTTSByArrayBuffers
  it('uploadTTSByArrayBuffers should create a file and call uploadTTSFile', async () => {
    const messageId = 'message-id';
    const arrayBuffers = [new ArrayBuffer(10)];

    // Spy on uploadTTSFile to simulate a successful upload
    const uploadTTSFileSpy = vi
      .spyOn(useStore.getState(), 'uploadWithProgress')
      .mockResolvedValue({ id: 'new-tts-file-id', url: '1' });

    let fileId;
    await act(async () => {
      fileId = await useStore.getState().uploadTTSByArrayBuffers(messageId, arrayBuffers);
    });

    expect(uploadTTSFileSpy).toHaveBeenCalled();
    expect(fileId).toBe('new-tts-file-id');

    // Cleanup spy
    uploadTTSFileSpy.mockRestore();
  });

  // Test for useFetchTTSFile
  it('useFetchTTSFile should fetch and return file data', async () => {
    const fileId = 'tts-file-id';
    const fileData = {
      id: fileId,
      name: 'test',
      url: 'blob:test',
      fileType: 'audio/mp3',
      base64Url: '',
      saveMode: 'local',
    };

    // Mock the fileService.getFile to resolve with fileData
    vi.mocked(lambdaClient.file.getFileItemById.query).mockResolvedValue(fileData as any);

    const { result } = renderHook(() => useStore.getState().useFetchTTSFile(fileId), { wrapper });

    // Wait for SWR to fetch data
    await waitFor(() => {
      expect(result.current.data).toEqual(fileData);
    });

    expect(lambdaClient.file.getFileItemById.query).toHaveBeenCalledWith({ id: fileId });
    expect(useStore.getState().fileDetailMap[fileId]?.file).toEqual(fileData);
  });

  it('does not request a file when no TTS attachment is selected', () => {
    const { result } = renderHook(() => useStore.getState().useFetchTTSFile(null), { wrapper });
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(lambdaClient.file.getFileItemById.query).not.toHaveBeenCalled();
  });
});
