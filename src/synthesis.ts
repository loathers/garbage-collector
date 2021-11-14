import {
  availableAmount,
  mySpleenUse,
  retrieveItem,
  spleenLimit,
  sweetSynthesis,
  sweetSynthesisResult,
} from "kolmafia";
import { $items, clamp } from "libram";
import { shuffle } from "./lib";

const whitelist = $items`sugar shotgun, sugar shillelagh, sugar shank, sugar chapeau, sugar shorts, sugar shield, sugar shirt, Fudgie Roll`;
export default function synthesize(effect: Effect, casts: number): void {
  const shuffledWhitelist = shuffle([...whitelist]);
  for (const itemA of shuffledWhitelist) {
    if (availableAmount(itemA) <= 1) continue;
    if (casts === 0) return;
    for (const itemB of shuffledWhitelist) {
      const minimum = itemA === itemB ? 2 : 1;
      if (availableAmount(itemB) <= minimum) continue;
      if (sweetSynthesisResult(itemA, itemB) !== effect) continue;
      const possibleCasts =
        itemA === itemB
          ? Math.floor((availableAmount(itemA) - 1) / 2)
          : Math.min(availableAmount(itemA), availableAmount(itemB)) - 1;
      const spleen = Math.max(spleenLimit() - mySpleenUse(), 0);
      const castsToDo = Math.min(possibleCasts, casts, spleen);
      if (castsToDo === 0) continue;
      if (itemA === itemB) retrieveItem(itemA, castsToDo * 2);
      else {
        retrieveItem(itemA, castsToDo);
        retrieveItem(itemB, castsToDo);
      }
      if (sweetSynthesis(castsToDo, itemA, itemB)) casts -= castsToDo;
    }
  }

  for (let i = 0; i < clamp(casts, 0, spleenLimit() - mySpleenUse()); i++) {
    sweetSynthesis(effect);
  }
}
