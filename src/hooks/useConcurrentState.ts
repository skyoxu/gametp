import { useDeferredValue, useState, useTransition } from 'react';

/**
 * Note
 * - startTransition setState
 * - useDeferredValue /
 */
export function useConcurrentState<T>(initial: T) {
  const [state, setState] = useState<T>(initial);
  const deferred = useDeferredValue(state);
  const [isPending, startTransition] = useTransition();

  const set = (updater: T | ((prev: T) => T)) => {
    startTransition(() => {
      // @ts-ignore
      setState(updater);
    });
  };

  return { state, set, deferred, isPending } as const;
}
