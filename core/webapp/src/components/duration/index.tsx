import { Text } from 'components/text';
import { createTimeout } from 'lib/createTimeout';
import { useEffect } from 'react';
import { useState } from 'react';

const MS_IN_ONE_SEC = 1000;
const MS_IN_ONE_MIN = 60 * MS_IN_ONE_SEC;
const MS_IN_ONE_HOUR = 60 * MS_IN_ONE_MIN;
const MS_IN_ONE_DAY = 24 * MS_IN_ONE_HOUR;

const computeDuration = (from?: number | Date, to?: number | Date) => {
  if (!from) {
    return {
      duration: '',
      next: null,
    };
  }
  const actualTo = to ? new Date(to).valueOf() : Date.now();

  const delta = Math.max(0, actualTo - new Date(from).valueOf());
  if (delta < MS_IN_ONE_MIN) {
    return {
      duration: `${(delta / MS_IN_ONE_SEC).toFixed(0)}s`,
      next: MS_IN_ONE_SEC,
    };
  }
  if (delta < MS_IN_ONE_HOUR) {
    return {
      duration: `${(delta / MS_IN_ONE_MIN).toFixed(0)}min${(
        (delta % MS_IN_ONE_MIN) /
        MS_IN_ONE_SEC
      ).toFixed(0)}`,
      next: MS_IN_ONE_SEC,
    };
  }

  if (delta < MS_IN_ONE_DAY) {
    return {
      duration: `${(delta / MS_IN_ONE_HOUR).toFixed(0)}h${(
        (delta % MS_IN_ONE_HOUR) /
        MS_IN_ONE_MIN
      ).toFixed(0)}`,
      next: MS_IN_ONE_MIN,
    };
  }
  return {
    duration: `${(delta / MS_IN_ONE_DAY).toFixed(0)}day${(
      (delta % MS_IN_ONE_DAY) /
      MS_IN_ONE_HOUR
    ).toFixed(0)}`,
    next: 5 * MS_IN_ONE_MIN,
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
