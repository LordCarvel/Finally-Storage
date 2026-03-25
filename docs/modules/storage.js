const APP_STATE_KEY = 'finallyStorageAppState';
const PREVIEW_IMAGE_KEY = 'finallyStoragePreviewImage';

const canUseStorage = () => typeof window !== 'undefined' && Boolean(window.localStorage);

const readJson = (key, fallback) => {
  if (!canUseStorage()) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.error(`Falha ao ler ${key} do localStorage`, error);
    return fallback;
  }
};

const writeJson = (key, value) => {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Falha ao salvar ${key} no localStorage`, error);
  }
};

export const saveLocalStorage = (state) => {
  const snapshot = {
    ...state,
    lastPreviewImageDataUrl: '',
    lastPreviewGeneratedAt: ''
  };

  writeJson(APP_STATE_KEY, snapshot);

  if (state?.lastPreviewImageDataUrl) {
    writeJson(PREVIEW_IMAGE_KEY, {
      dataUrl: state.lastPreviewImageDataUrl,
      generatedAt: state.lastPreviewGeneratedAt || ''
    });
  }
};

export const loadLocalStorage = () => {
  const savedState = readJson(APP_STATE_KEY, null);
  const savedPreview = readJson(PREVIEW_IMAGE_KEY, null);

  if (!savedState && !savedPreview) return null;

  return {
    ...(savedState || {}),
    lastPreviewImageDataUrl: savedPreview?.dataUrl || '',
    lastPreviewGeneratedAt: savedPreview?.generatedAt || ''
  };
};

export const createDebouncedSaver = (saveFn, delay = 250) => {
  let timer = null;

  return (state) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => saveFn(state), delay);
  };
};
