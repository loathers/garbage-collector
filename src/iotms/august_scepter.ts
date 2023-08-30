import { canAdventure } from "kolmafia";
import { $effect, $familiar, $item, $items, $location, get, have, Range } from "libram";
import { embezzlerCount } from "../counts/embezzler";
import { Potion } from "../potions/potion";
import { globalOptions } from "../config";
import { garboAverageValue, garboValue } from "../value";
import { isTodaysScepterSkill } from "./august_scepter/lib";

export function shouldAugustCast(skillNum: Range<1, 32>): boolean {
  return AugustScepterValuationCache.includes(skillNum) || isTodaysScepterSkill(skillNum);
}

const MPA = get("valueOfAdventure");

const marginalEmbezzler = globalOptions.prefs.embezzlerMultiplier * MPA;

const oysters = $items`brilliant oyster egg, gleaming oyster egg, glistening oyster egg, lustrous oyster egg, magnificent oyster egg, pearlescent oyster egg, scintillating oyster egg`;

type DateNumberPair = [Range<1, 32>, number];
const AugustScepterValuationLookup: Array<DateNumberPair> = [
  [1, valueAug1()],
  [2, valueAug2()],
  [3, valueAug3()],
  [4, valueAug4()],
  [5, valueAug5()],
  [7, valueAug7()],
  [8, valueAug8()],
  [13, valueAug13()],
  [16, valueAug16()],
  [22, valueAug22()],
  [24, valueAug24()],
  [25, valueAug25()],
  [29, valueAug29()],
  [31, valueAug31()],
];
export const AugustScepterValuationCache = AugustScepterValuationLookup.filter(
  (element) => !isTodaysScepterSkill(element[0]),
)
  .sort((a, b) => b[1] - a[1])
  .map((element) => element[0])
  .slice(0, 5);

function valueAug1(): number {
  return 3 * MPA;
}
function valueAug2(): number {
  return canAdventure($location`Cobb's Knob Treasury`) ? marginalEmbezzler : 0;
}
function valueAug3(): number {
  return garboValue($item`watermelon`);
}
function valueAug4(): number {
  /* Currently just the sale value.
     If implmented in the combat macro,
     we'd take the ceiling between the
     sale value and the 40% bump for 100adv.
  */
  return 3 * garboValue($item`water balloon`);
}
function valueAug5(): number {
  return 3 * garboAverageValue(...oysters);
}
function valueAug7(): number {
  return new Potion($item`august scepter`, {
    effect: $effect`Incredibly Well Lit`,
    duration: 30,
  }).gross(embezzlerCount());
}
function valueAug8(): number {
  // waiting on free fight valuation updates to drop
  return 0;
}
function valueAug13(): number {
  return globalOptions.ascend ? 0 : 5 * MPA + (have($familiar`Left-Hand Man`) ? 5 * MPA : 0);
}

function valueAug16(): number {
  return 8 * get("valueOfAdventure");
}
function valueAug22(): number {
  // waiting on free fight valuation updates to drop
  return 0;
}
function valueAug24(): number {
  return 3 * garboValue($item`waffle`);
}
function valueAug25(): number {
  return garboValue($item`banana split`);
}
function valueAug29(): number {
  return 3 * garboValue($item`Mrs. Rush`);
}
function valueAug31(): number {
  return 2 * garboValue($item`bottle of Cabernet Sauvignon`);
}
