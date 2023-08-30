import { todayToString } from "kolmafia";
import { $item, AugustScepter, get, have, Range } from "libram";

export function canAugustCast(skillNum: Range<1, 32>): boolean {
  return (
    have($item`august scepter`) &&
    !AugustScepter.getAugustCast(skillNum) &&
    ((isTodaysScepterSkill(skillNum) && !AugustScepter.getTodayCast()) || get(`_augSkillsCast`) < 5)
  );
}

export function todaysDayNumber(): number {
  return Number(todayToString()) % 100;
}

export function isTodaysScepterSkill(skillNum: Range<1, 32>): boolean {
  return todaysDayNumber() === skillNum;
}

export function augustScepterSpace(): number {
  return canAugustCast(16) ? 1 : 0;
}
