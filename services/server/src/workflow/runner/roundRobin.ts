export const createRoundRobin = () => {
  const ids: string[] = [];
  let cursor = 0;
  return {
    get length() {
      return ids.length;
    },
    getNext() {
      if (!ids.length) {
        cursor = 0;
        return null;
      }

      const r = ids[cursor];
      cursor = (cursor + 1) % ids.length;
      return r;
    },
    add(id: string) {
      if (ids.findIndex((i) => i === id) === -1) {
        ids.push(id);
      }
    },
    remove(id: string) {
      const idx = ids.findIndex((i) => i === id);
      if (idx === -1) {
        return;
      }
    },
  };
};
