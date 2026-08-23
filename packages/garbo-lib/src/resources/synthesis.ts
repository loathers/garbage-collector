import {
  availableAmount,
  Effect,
  mallPrice,
  mySpleenUse,
  retrieveItem,
  spleenLimit,
  sweetSynthesis,
  sweetSynthesisResult,
} from "kolmafia";
import { $item, $items, clamp } from "libram";
import { shuffle } from "../lib";

const allowList = $items`Fudgie Roll, peanut brittle shield, sugar shotgun, sugar shillelagh, sugar shank, sugar chapeau, sugar shorts, sugar shield, sugar shirt`;

// For safety, explicitly skip candies that are no longer obtainable or extremely rare
const blockList = new Set([
  $item`candied nuts`,
  $item`candy kneecapping stick`,
  $item`chocolate cigar`,
  $item`fancy but probably evil chocolate`,
  $item`fancy chocolate`,
  $item`fancy chocolate car`,
  $item`gummi ammonite`,
  $item`gummi belemnite`,
  $item`gummi trilobite`,
  $item`powdered candy sushi set`,
  $item`radio button candy`,
  $item`spiritual candy cane`,
  $item`Ultra Mega Sour Ball`,
  $item`vitachoconutriment capsule`,
]);

export function synthesize(casts: number, effect: Effect): void {
  const saveLimit = 1;
  const buyableCandies = $items
    .all()
    .filter(
      (i) => i.tradeable && i.candyType === "complex" && !blockList.has(i),
    )
    .sort((a, b) => mallPrice(a) - mallPrice(b))
    .slice(0, 50);
  const shuffledAllowlist = shuffle(allowList);
  for (const untradeable of shuffledAllowlist) {
    if (availableAmount(untradeable) <= saveLimit) continue;
    for (const buyable of buyableCandies) {
      if (sweetSynthesisResult(untradeable, buyable) !== effect) continue;
      const possibleCasts = availableAmount(untradeable) - saveLimit;
      const spleen = Math.max(spleenLimit() - mySpleenUse(), 0);
      const castsToDo = Math.min(possibleCasts, casts, spleen);
      if (castsToDo === 0) continue;
      retrieveItem(untradeable, castsToDo);
      retrieveItem(buyable, castsToDo);
      if (sweetSynthesis(castsToDo, untradeable, buyable)) casts -= castsToDo;
      if (casts <= 0) return;
    }
  }

  sweetSynthesis(clamp(casts, 0, spleenLimit() - mySpleenUse()), effect);
}
