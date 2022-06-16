import { useEffect, useMemo, useRef, useState } from 'react';

import { createTimeout } from 'lib/createTimeout';

export const useDebouncedState = <T>(state: T, delay: number = 300) => {
  const [debounced, setDebounced] = useState(state);

  useEffect(() => {
    return createTimeout(() => {
      if (debounced !== state) {
        setDebounced(state);
      }
    }, delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, delay]);

  return debounced;
};

/**
 * callback is called only on update
 */
export const useUpdateEffect = (callback: () => void) => {
  const ref = useRef(false);
  useEffect(() => {
    if (!ref.current) {
      ref.current = true;
      return;
    }
    callback();
  }, [callback]);
};

export const useHover = () => {
  const [isHover, setIsHover] = useState(false);
  const bindings = useMemo(
    () => ({
      onMouseEnter() {
        setIsHover(true);
      },
      onMouseLeave() {
        setIsHover(false);
      },
    }),
    []
  );

  return [isHover, bindings] as const;
};
