// export type GeneratorReturnValue<T> = T extends Generator<any, infer Ret>
//   ? Ret
//   : never;

export const mapObject = <T, U>(
  object: Record<string, T>,
  mapper: (value: T, key: string) => U
) => {
  const res = {};
  if (object) {
    for (const [key, value] of Object.entries(object)) {
      res[key] = mapper(value, key);
    }
  }
  return res;
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
    typeof v === "object" &&
    typeof v.then === "function" &&
    typeof v.catch === "function"
  ) {
    return true;
  }
  return false;
};
