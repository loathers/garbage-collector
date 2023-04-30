import { SongBoom } from "libram";

export enum BonusEquipMode {
  FREE,
  EMBEZZLER,
  DMT,
  BARF,
}

export function isFree(mode: BonusEquipMode): boolean {
  return [BonusEquipMode.FREE, BonusEquipMode.DMT].includes(mode);
}

export function useLimitedDrops(mode: BonusEquipMode): boolean {
  return [BonusEquipMode.BARF, BonusEquipMode.FREE].includes(mode);
}

export function valueOfMeat(mode: BonusEquipMode): number {
  return isFree(mode)
    ? 0
    : (250 +
        (mode === BonusEquipMode.EMBEZZLER ? 750 : 0) +
        (SongBoom.song() === "Total Eclipse of Your Meat" ? 25 : 0)) /
        100;
}

export function valueOfItem(mode: BonusEquipMode): number {
  return mode === BonusEquipMode.BARF ? 0.72 : 0;
}
