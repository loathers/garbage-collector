import {
  $effect,
  $item,
  CinchoDeMayo,
  clamp,
  get,
  getModifier,
  have,
  realmAvailable,
} from "libram";
import { globalOptions } from "../../config";
import { Effect, haveEffect, Item } from "kolmafia";

export function freeFishyAvailable(): boolean {
  return (
    have($effect`Fishy`) || (have($item`fishy pipe`) && !get("_fishyPipeUsed"))
  );
}

export function shouldYachtzee(): boolean {
  const nonCombats = freeNCs();
  return (
    realmAvailable("sleaze") &&
    nonCombats > 0 &&
    get("valueOfAdventure") * nonCombats < 20000 * nonCombats
  ); // Can we check for "value of doing the taffy copier"?
}

export function cinchNCs(): number {
  return CinchoDeMayo.have()
    ? Math.floor(CinchoDeMayo.totalAvailableCinch() / 60)
    : 0;
}

// These NCs do not require us to enter combat to activate them
export const freeNCs = (): number =>
  (have($item`Clara's bell`) && !globalOptions.clarasBellClaimed ? 1 : 0) +
  cinchNCs() +
  (have($item`Apriling band tuba`)
    ? $item`Apriling band tuba`.dailyusesleft
    : 0);

export function maximumYachtzees(): number {
  return clamp(
    freeNCs(),
    0,
    have($item`fishy pipe`) && !get("_fishyPipeUsed")
      ? 10
      : haveEffect($effect`Fishy`),
  );
}

export function yachtzeeBuffValue(obj: Item | Effect): number {
  return clamp(
    (2000 *
      (getModifier("Meat Drop", obj) +
        getModifier("Familiar Weight", obj) * 2.5)) /
      100,
    0,
    20000,
  );
}
