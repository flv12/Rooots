export const REPEAT = {
  /** Wait before auto-repeat kicks in after a long press. */
  holdMs: 400,
  initialMs: 280,
  factor: 0.82,
  minMs: 30,
};

/** Delay before the n-th auto-repeat step: exponential acceleration, clamped. */
export function repeatDelay(n: number): number {
  return Math.max(REPEAT.minMs, REPEAT.initialMs * REPEAT.factor ** n);
}
