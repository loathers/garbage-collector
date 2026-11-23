import {
  itemDropModifier,
  itemDropsArray,
  meatDrop,
  meatDropModifier,
  Monster,
} from "kolmafia";
import {
  $item,
  $location,
  $monster,
  $skill,
  AdventureTarget,
  adventureTargetToWeightedMap,
  clamp,
  get,
  getModifier,
  have,
  SongBoom,
  sum,
} from "libram";
import { garboValue } from "../garboValue";
import { FarmingStrategy } from "../farmingStrategy";
import {
  isFree,
  romanticMonsterImpossible,
  sober,
  targetingMeat,
  willDrunkAdventure,
} from "../lib";

const MEAT_CLIP_VALUE = 520;

function shouldWaitForCheaperFight(target: AdventureTarget): boolean {
  if (targetingMeat() && !romanticMonsterImpossible()) return true;

  return [...adventureTargetToWeightedMap(target)].some(
    ([monster, weight]) =>
      weight > 0 &&
      !isFree(monster) &&
      meatDrop(monster) > FarmingStrategy.meatDrop,
  );
}

function meatValueLost(monster: Monster): number {
  const meatMultiplier = Math.max(0, 1 + meatDropModifier() / 100);
  const singAlongMeatLost = have($skill`Sing Along`) ? 25 * meatMultiplier : 0;
  const songBonusMeatLost = meatDrop(monster) * Math.min(0.3, meatMultiplier);

  return singAlongMeatLost + songBonusMeatLost;
}

function foodValueGained(monster: Monster): number {
  const foodModifier = itemDropModifier() + getModifier("Food Drop");
  return sum(itemDropsArray(monster), ({ drop, rate, type }) => {
    if (drop.fullness <= 0 || !["", "n"].includes(type)) return 0;
    const currentRate = clamp((rate * (100 + foodModifier)) / 100, 0, 100);
    const boostedRate = clamp((rate * (130 + foodModifier)) / 100, 0, 100);
    return ((boostedRate - currentRate) / 100) * garboValue(drop);
  });
}

function fightValueLost(target: AdventureTarget): number | null {
  const monsters = [...adventureTargetToWeightedMap(target)].filter(
    ([monster]) => monster !== $monster.none && !isFree(monster),
  );
  const totalWeight = sum(monsters, 1);
  if (totalWeight === 0) return null;

  return (
    sum(
      monsters,
      ([monster, weight]) =>
        weight * (meatValueLost(monster) - foodValueGained(monster)),
    ) / totalWeight
  );
}

/** Whether to switch songs to collect a seasoning. */
export function shouldCollectSongBoomSeasoning(
  target: AdventureTarget,
): boolean {
  if (
    !SongBoom.have() ||
    SongBoom.song() !== "Total Eclipse of Your Meat" ||
    !sober() ||
    SongBoom.dropProgress() !== 10 ||
    shouldWaitForCheaperFight(target)
  ) {
    return false;
  }

  // Save a change for Food Vibrations if we expect to farm overdrunk.
  if (SongBoom.songChangesLeft() < 2 + Number(willDrunkAdventure())) {
    return false;
  }

  if (target === $location`Barf Mountain` && get("dinseyRollercoasterNext")) {
    return false;
  }

  const valueLost = fightValueLost(target);
  return (
    valueLost !== null &&
    garboValue($item`Special Seasoning`) > MEAT_CLIP_VALUE + valueLost
  );
}

export function shouldRestoreSongBoomMeat(target: AdventureTarget): boolean {
  return (
    SongBoom.have() &&
    sober() &&
    SongBoom.song() === "Food Vibrations" &&
    (SongBoom.dropProgress() < 10 || shouldWaitForCheaperFight(target)) &&
    SongBoom.songChangesLeft() > 0
  );
}
