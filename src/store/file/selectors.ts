import { filesSelectors as imageFilesSelectors } from './slices/chat';
import { ttsFilesSelectors } from './slices/tts';

export const filesSelectors = {
  ...imageFilesSelectors,
  ...ttsFilesSelectors,
};

export { fileChatSelectors } from './slices/chat/selectors';
// Leaf module on purpose: the slice barrel also pulls in `action.ts`, which
// imports this store back — reaching it from the store entry would close the
// cycle before the store is initialized.
export { documentSelectors } from './slices/document/selectors';
export * from './slices/fileManager/selectors';
