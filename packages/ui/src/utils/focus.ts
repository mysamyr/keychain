import { useEffect, useRef } from 'react';

/** Focus the returned element whenever `value` changes after the first render. */
export function useFocusOnChange<T extends HTMLElement>(value: unknown) {
  const ref = useRef<T>(null);
  const previous = useRef(value);

  useEffect(() => {
    if (Object.is(previous.current, value)) return;
    previous.current = value;
    ref.current?.focus();
  }, [value]);

  return ref;
}
