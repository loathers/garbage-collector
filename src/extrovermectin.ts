import { equip, toMonster, useFamiliar } from "kolmafia";
import {
  $item,
  $items,
  $location,
  $monster,
  $skill,
  $slot,
  adventureMacro,
  clamp,
  CrystalBall,
  get,
  have,
  Requirement,
} from "libram";
import { freeFightFamiliar } from "./familiar";
import { findRun, ltbRun, setChoice } from "./lib";
import { Macro } from "./combat";

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
  return get("beGregariousCharges") > 0 || get("beGregariousFightsLeft") > 0;
}

export function crateStrategy(): "Sniff" | "Saber" | "Orb" | null {
  if (!doingExtrovermectin()) return null;
  if (have($skill`Transcendent Olfaction`)) return "Sniff";
  if (have($item`miniature crystal ball`)) return "Orb";
  if (have($item`Fourth of May Cosplay Saber`)) return "Saber";
  return null;
}

export function saberCrateIfDesired(): void {
  if (!have($item`Fourth of May Cosplay Saber`) || get("_saberForceUses") >= 5) return;
  if (
    get("_saberForceUses") > 0 &&
    (get("_saberForceMonster") !== $monster`crate` || get("_saberForceMonsterCount") < 2)
  ) {
    const run = findRun() ?? ltbRun;

    new Requirement([], { forceEquip: $items`Fourth of May Cosplay Saber` })
      .merge(run.requirement ? run.requirement : new Requirement([], {}))
      .maximize();
    useFamiliar(freeFightFamiliar());
    if (run.prepare) run.prepare();
    setChoice(1387, 2);
    adventureMacro(
      $location`Noob Cave`,
      Macro.if_($monster`crate`, Macro.skill($skill`Use the Force`))
        .if_($monster`time-spinner prank`, Macro.kill())
        .ifHolidayWanderer(run.macro)
        .abort()
    );
  }
}

export function equipOrbIfDesired(): void {
  if (
    have($item`miniature crystal ball`) &&
    CrystalBall.currentPredictions(false).get($location`Noob Cave`) ===
      $monster`Knob Goblin Embezzler` &&
    !(get("_saberForceMonster") === $monster`crate` && get("_saberForceMonsterCount") > 0) &&
    (crateStrategy() !== "Sniff" ||
      !$location`Noob Cave`.combatQueue
        .split(";")
        .map((monster) => toMonster(monster))
        .includes($monster`Knob Goblin Embezzler`))
  ) {
    equip($slot`familiar`, $item`miniature crystal ball`);
  }
}
