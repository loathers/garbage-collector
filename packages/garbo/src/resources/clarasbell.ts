import { $item, get, have } from "libram";
import { shouldYachtzee } from "../lib";

const CLARA_TARGETS = [
  "volcoino",
  "yachtzee",
  "gerald/ine",
  "shadow waters",
] as const;
type ClaraTarget = (typeof CLARA_TARGETS)[number];

let _claraIsVolcoino = false;
export const claimClaraVolcoino = () => (_claraIsVolcoino = true);
export const claraTarget = () =>
  _claraIsVolcoino
    ? "volcoino"
    : shouldYachtzee()
      ? "yachtzee"
      : ["food", "booze"].includes(get("_questPartyFairQuest"))
        ? "gerald/ine"
        : "shadow waters";
export const shouldClara = (target: ClaraTarget) =>
  have($item`Clara's bell`) &&
  !get("_claraBellUsed") &&
  CLARA_TARGETS.indexOf(claraTarget()) >= CLARA_TARGETS.indexOf(target);
