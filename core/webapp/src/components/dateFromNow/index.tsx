import dayjs from 'dayjs';
import relative from 'dayjs/plugin/relativeTime';
import { createTimeout } from 'lib/createTimeout';
import { useEffect, useState } from 'react';

dayjs.extend(relative);

export const DateFromNow = ({ date }: { date: number | Date }) => {
  const [fromNow, setFromNow] = useState(() => dayjs(date).fromNow());

  useEffect(() => {
    const updateFromNow = () => {
      const next = dayjs(date).fromNow();
      if (fromNow !== next) {
        setFromNow(next);
      }
    };
    if (fromNow.endsWith('seconds ago')) {
      return createTimeout(updateFromNow, 15 * 1000);
    }
    if (fromNow.endsWith('minute ago') || fromNow.endsWith('minutes ago')) {
      return createTimeout(updateFromNow, 60 * 1000);
    }
    if (fromNow.endsWith('hour ago') || fromNow.endsWith('hours ago')) {
      return createTimeout(updateFromNow, 60 * 1000);
    }
  }, [fromNow, date]);

  return <span>{fromNow}</span>;
};
