import { Text } from 'components/text';
import { createTimeout } from 'lib/createTimeout';
import { useEffect } from 'react';
import { useState } from 'react';

const computeDuration = (from?: number | Date, to?: number | Date) => {
  if (!from) {
    return {
      duration: '',
      next: null,
    };
  }
  const actualTo = to ? new Date(to).valueOf() : Date.now();

  const delta = Math.max(0, actualTo - new Date(from).valueOf());
  if (delta < 60 * 1000) {
    return {
      duration: `${(delta / 1000).toFixed(0)}s`,
      next: 1000,
    };
  }
  if (delta < 60 * 60 * 1000) {
    return {
      duration: `${(delta / (60 * 1000)).toFixed(0)}min${(
        (delta % (60 * 1000)) /
        1000
      ).toFixed(0)}`,
      next: 1000,
    };
  }
  if (delta < 60 * 60 * 1000) {
    return {
      duration: `${(delta / (60 * 1000)).toFixed(0)}min${(
        (delta % (60 * 1000)) /
        1000
      ).toFixed(0)}`,
      next: 1000,
    };
  }

  return {
    duration: `${(delta / (60 * 60 * 1000)).toFixed(2)}h${(
      ((delta % (60 * 60 * 1000)) / 60) *
      1000
    ).toFixed(0)}`,
    next: 60 * 1000,
  };
};

export const Duration = ({
  from,
  to,
}: {
  from?: number | Date;
  to?: number | Date;
}) => {
  let [text, setText] = useState(() => {
    return computeDuration(from, to);
  });

  // on from | to change
  useEffect(() => {
    setText(computeDuration(from, to));
  }, [from, to]);
  useEffect(() => {
    if (!text.next) {
      return;
    }
    return createTimeout(() => {
      setText(computeDuration(from, to));
    }, text.next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  if (!text.duration) {
    return null;
  }

  return <Text>{text.duration}</Text>;
};
