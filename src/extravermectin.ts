import { $item, $skill, get, have } from "libram";

export function expectedGregs(): number {
  let gregs = 3;
  if (have($item`Time-Spinner`)) gregs += Math.floor((10 - get("_timeSpinnerMinutesUsed")) / 3);
  if (have($skill`Meteor Lore`)) gregs += 10 - get("_macrometeoriteUses");
}
