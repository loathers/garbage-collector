import { $item, $skill, clamp, get, have } from "libram";

export function expectedGregs(): number {
  const baseGregs = 3;
  const timeSpunGregs = have($item`Time-Spinner`)
    ? Math.floor((10 - get("_timeSpinnerMinutesUsed")) / 3)
    : 0;
  const orbGregs = have($item`miniature crystal ball`) ? 1 : 0;

  const macrometeors = have($skill`Meteor Lore`) ? 10 - get("_macrometeoriteUses") : 0;
  const replaceEnemies = have($item`Powerful Glove`)
    ? Math.floor((100 - get("_powerfulGloveBatteryPowerUsed")) / 10)
    : 0;
  const totalMonsterReplacers = macrometeors + replaceEnemies;

  const sabersLeft = have($item`Fourth of May Cosplay Saber`)
    ? clamp(5 - get("_saberForceUses"), 0, 3)
    : 0;

  const baseRateMultiplier = have($skill`Transcendent Olfaction`) ? 0.95 : 0.75;
  const monsterReplacerGregs = clamp(
    totalMonsterReplacers,
    0,
    2 * sabersLeft + baseRateMultiplier * (totalMonsterReplacers - 2 * sabersLeft)
  );
  const gregs = baseGregs + timeSpunGregs + orbGregs + monsterReplacerGregs;
  return gregs;
}

export function doingExtrovermectin(): boolean {
  return true; //obviously this function will get fleshed out a lot later
}
