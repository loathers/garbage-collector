import { $item, $skill, get, have } from "libram";

export function expectedGregs(): number {
  const baseGregs = 3;
  const timeSpunGregs = have($item`Time-Spinner`)
    ? Math.floor((10 - get("_timeSpinnerMinutesUsed")) / 3)
    : 0;
  const orbGregs = have($item`miniature crystal ball`) ? 1 : 0;

  const macrometeors = have($skill`Meteor Lore`) ? 10 - get("_macrometeoriteUses") : 0;
  const replaceEnemies = have($item`powerful glove`)
    ? Math.floor((100 - get("_powerfulGloveBatteryPowerUsed")) / 10)
    : 0;
  const totalMonsterReplacers = macrometeors + replaceEnemies;

  const sabersLeft = have($item`fourth of may cosplay saber`)
    ? clamp(5 - get("_saberForceUses"), 0, 3)
    : 0;

  const gregs = baseGregs + timeSpunGregs + orbGregs + monsterReplacerGregs;
  return gregs;
}
