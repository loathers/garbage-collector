import {
  availableAmount,
  haveEffect,
  itemAmount,
  mySpleenUse,
  spleenLimit,
  sweetSynthesis,
  sweetSynthesisResult,
} from "kolmafia";
import { $items, clamp } from "libram";
import { shuffle } from "./lib";

const whitelist = $items`sugar shotgun, sugar shillelagh, sugar shank, sugar chapeau, sugar shorts, sugar shield, sugar shirt, Fudgie Roll`;
export default function synthesize(effect: Effect, minTurns: number): void {
  const shuffledWhitelist = shuffle([...whitelist]);
  for (const itemA of shuffledWhitelist) {
    if (haveEffect(effect) >= minTurns) return;
    if (availableAmount(itemA) <= 1) continue;
    for (const itemB of shuffledWhitelist) {
      if (haveEffect(effect) >= minTurns) return;
      const minimum = itemA === itemB ? 2 : 1;
      if (availableAmount(itemB) <= minimum) continue;
      if (sweetSynthesisResult(itemA, itemB) !== effect) continue;
      const possibleCasts =
        itemA === itemB
          ? Math.floor((itemAmount(itemA) - 1) / 2)
          : Math.min(itemAmount(itemA), itemAmount(itemB)) - 1;
      const neededCasts = Math.floor((minTurns - haveEffect(effect)) / 30);
      const spleen = Math.max(spleenLimit() - mySpleenUse(), 0);
      const casts = Math.min(possibleCasts, neededCasts, spleen);
      if (casts === 0) continue;
      sweetSynthesis(casts, itemA, itemB);
    }
  }

  const neededCasts = Math.floor((minTurns - haveEffect(effect)) / 30);
  for (let i = 0; i < clamp(neededCasts, 0, spleenLimit() - mySpleenUse()); i++) {
    sweetSynthesis(effect);
  }
}
