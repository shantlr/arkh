// export type GeneratorReturnValue<T> = T extends Generator<any, infer Ret>
//   ? Ret
//   : never;

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
// export const isGenerator = (v: any): v is Generator => {
//   if (
//     typeof v === "object" &&
//     typeof v.next === "function" &&
//     typeof v.throw === "function"
//   ) {
//     return true;
//   }
//   return false;
// };
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
