/** Slow start, fast middle, slow end. */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/** Longer distances take a bit longer, within comfortable bounds (ms). */
export function scrollDuration(distance: number): number {
  return Math.round(Math.min(1000, Math.max(450, 350 + distance / 8)));
}

type Scrollable = { scrollToOffset: (params: { offset: number; animated: boolean }) => void };

/**
 * Scrolls to the top along an ease-in-out curve, frame by frame (the native animated scroll has
 * a fixed curve we cannot choose). Returns a function that cancels it, e.g. when the user touches
 * the list.
 */
export function animateScrollToTop(list: Scrollable, from: number): () => void {
  const duration = scrollDuration(from);
  const start = Date.now();
  let frame = 0;
  const step = () => {
    const t = Math.min(1, (Date.now() - start) / duration);
    list.scrollToOffset({ offset: from * (1 - easeInOutCubic(t)), animated: false });
    if (t < 1) frame = requestAnimationFrame(step);
  };
  frame = requestAnimationFrame(step);
  return () => cancelAnimationFrame(frame);
}
