export const createWindowMouseEventListener = (
  eventName: 'click' | 'mouseup' | 'mousedown' | 'mousemove',
  listener: (event: MouseEvent) => void
) => {
  window.addEventListener(eventName, listener);
  return () => window.removeEventListener(eventName, listener);
};
