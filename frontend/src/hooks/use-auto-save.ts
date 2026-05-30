import { useEffect, useRef, useCallback } from 'react';
import { useDebounce } from './use-debounce';

export function useAutoSave<T>(
  value: T,
  onSave: (value: T) => Promise<void>,
  delay = 2000,
) {
  const debouncedValue = useDebounce(value, delay);
  const isFirstRender = useRef(true);
  const saving = useRef(false);

  const save = useCallback(async () => {
    if (saving.current) return;
    saving.current = true;
    try {
      await onSave(debouncedValue);
    } finally {
      saving.current = false;
    }
  }, [debouncedValue, onSave]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    save();
  }, [debouncedValue, save]);

  return { isSaving: saving.current };
}
