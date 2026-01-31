import {
  myBasestat,
  myDaycount,
  myLevel,
  myPrimestat,
  Skill,
  Stat,
} from "kolmafia";
import {
  $item,
  $skill,
  $stat,
  BloodCubicZirconia,
  clamp,
  get,
  have,
} from "libram";
import { globalOptions } from "../config";
import { baseMeat, mainStatLevel } from "../lib";

function sweatEquityROI(): number {
  return baseMeat() * 0.4 * 30;
}

function parentStat(sub: Stat | null): Stat {
  switch (sub) {
    case $stat`subMuscle`:
      return $stat`Muscle`;
    case $stat`subMysticality`:
      return $stat`Mysticality`;
    case $stat`subMoxie`:
      return $stat`Moxie`;
  }
  return $stat`Muscle`;
}

const BCT_LEVEL_THRESHOLDS = [26, 20, 13];
export function getBCZStatFloor(skill: Skill): number {
  const userSelectedStatFloor = get("garbo_bczStatFloor", 0);
  const stat = parentStat(BloodCubicZirconia.substatUsed(skill));
  if (stat !== myPrimestat()) {
    if (stat === $stat`Moxie` && have($item`crumpled felt fedora`)) {
      return clamp(200, userSelectedStatFloor, Infinity);
    }
    return clamp(100, userSelectedStatFloor, Infinity); // ? is this good?
  }
  const minimumLevel =
    globalOptions.ascend && myDaycount() >= 2
      ? BCT_LEVEL_THRESHOLDS.find((threshold) => myLevel() > threshold)
      : 26;
  if (!minimumLevel) {
    return clamp(myBasestat(stat), userSelectedStatFloor, Infinity); // So low level we can't afford to lose exp at all
  }

  return clamp(mainStatLevel(minimumLevel), userSelectedStatFloor, Infinity);
}

function safeBCZCasts(skill: Skill): number {
  return BloodCubicZirconia.availableCasts(skill, getBCZStatFloor(skill));
}

export function safeSweatEquityCasts(): number {
  return safeBCZCasts($skill`BCZ: Sweat Equity`);
}

export function safeSweatBulletCasts(drumMachineROI: number): number {
  if (sweatEquityROI() > drumMachineROI) return 0;
  return safeBCZCasts($skill`BCZ: Sweat Bullets`);
}
