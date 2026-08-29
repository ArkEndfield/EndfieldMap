/**
 * Cubic ease-out curve shared by animation renderers (active-layer pulse,
 * animated rings, electric-pole connections and zones).
 */
export function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}
