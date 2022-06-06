export const mapObject = <O extends Record<string, any>, Mapped>(
  object: O,
  mapper: <Key extends keyof O>(value: O[Key], key: Key) => Mapped
): Record<keyof O, Mapped> => {
  const res = {};
  if (object) {
    for (const [key, value] of Object.entries(object)) {
      res[key] = mapper(value, key);
    }
  }
  return res as Record<keyof O, Mapped>;
};

export const isPromise = (v: any): v is Promise<any> => {
  if (
    typeof v === 'object' &&
    typeof v.then === 'function' &&
    typeof v.catch === 'function'
  ) {
    return true;
  }
  return false;
};
