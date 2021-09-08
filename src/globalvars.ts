export const log = {
  initialEmbezzlersFought: 0,
  digitizedEmbezzlersFought: 0,
};

export const globalOptions: { ascending: boolean; stopTurncount: number | null; noBarf: boolean } =
  {
    stopTurncount: null,
    ascending: false,
    noBarf: false,
  };

export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}
