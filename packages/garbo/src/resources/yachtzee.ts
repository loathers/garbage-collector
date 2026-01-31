import {
  $effect,
  $item,
  CinchoDeMayo,
  clamp,
  get,
  have,
  realmAvailable,
} from "libram";
import { felizValue } from "../lib";
import { haveEffect, myAdventures } from "kolmafia";

const CLARA_TARGETS = [
  "volcoino",
  "yachtzee",
  "gerald/ine",
  "shadow waters",
] as const;
type ClaraTarget = (typeof CLARA_TARGETS)[number];

export const fishyTurns = () =>
  Math.max(haveEffect($effect`Fishy`) - myAdventures(), 0) +
  (have($item`fishy pipe`) && !get("_fishyPipeUsed") ? 10 : 0) +
  (get("skateParkStatus") === "ice" && !get("_skateBuff1") ? 30 : 0);

export function canYachtzee(): boolean {
  return (
    fishyTurns() > 0 &&
    realmAvailable("sleaze") &&
    get("valueOfAdventure") < 20_000
  ); // Can we check for "value of doing the taffy copier"?
}

let _claraIsVolcoino = false;
export const claimClaraVolcoino = () => (_claraIsVolcoino = true);
export const claraTarget = () =>
  _claraIsVolcoino
    ? "volcoino"
    : canYachtzee()
      ? "yachtzee"
      : ["food", "booze"].includes(get("_questPartyFairQuest"))
        ? "gerald/ine"
        : "shadow waters";
export const shouldClara = (target: ClaraTarget) =>
  have($item`Clara's bell`) &&
  !get("_claraBellUsed") &&
  CLARA_TARGETS.indexOf(claraTarget()) >= CLARA_TARGETS.indexOf(target);

export const nonCinchNCs = () =>
  shouldClara("yachtzee")
    ? 1
    : 0 +
      (have($item`Apriling band tuba`)
        ? $item`Apriling band tuba`.dailyusesleft
        : 0);

export const cinchNCs = () =>
  Math.min(
    Math.floor(CinchoDeMayo.totalAvailableCinch() / 60),
    Math.max(fishyTurns() - nonCinchNCs(), 0),
  );

export const maximumYachtzees = () =>
  clamp(nonCinchNCs() + cinchNCs(), 0, fishyTurns());

export const willYachtzee = () => canYachtzee() && maximumYachtzees() > 0;

export function cinchYachtzeeProfitable(): boolean {
  // A yachtzee costs a turn and gives us 20k meat for 60 cinch, projectile pinata costs 5 cinch and gets us 3 feliz candies
  return 20000 - get("valueOfAdventure") > 12 * 3 * felizValue();
}

export function maximumPinataCasts() {
  return canYachtzee() && cinchYachtzeeProfitable() // If we're doing Yachtzee at end of day, only use up our excess Cincho on candy
    ? Math.max(
        0,
        Math.floor((CinchoDeMayo.totalAvailableCinch() - cinchNCs() * 60) / 5),
      )
    : 30;
}
