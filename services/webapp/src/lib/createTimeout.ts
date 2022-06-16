export const createTimeout = (callback: () => void, delay: number) => {
  const handle = setTimeout(callback, delay);
  return () => clearTimeout(handle);
};
