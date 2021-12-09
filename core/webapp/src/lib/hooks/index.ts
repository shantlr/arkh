import { isEqual } from 'lodash';
import { useEffect, useState } from 'react';

export function useEqualMemo<T = any>(value: T): T {
  const [prev, setPrev] = useState(() => value);

  useEffect(() => {
    if (value === prev || isEqual(value, prev)) {
      return;
    }
    setPrev(value);
  }, [prev, value]);

  return prev;
}
