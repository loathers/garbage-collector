import {
  Familiar,
  myFamiliar,
  runChoice,
  useFamiliar,
  visitUrl,
} from "kolmafia";
import {
  $familiar,
  $item,
  findFairyMultiplier,
  get,
  getModifier,
  have,
  maxBy,
  set,
} from "libram";
import { menu } from "./freeFightFamiliar";
import { MEAT_TARGET_MULTIPLIER } from "../lib";

let bestNonCheerleaderFairy: Familiar;

export function sandwormFamiliar(): Familiar {
  if (
    have($familiar`Trick-or-Treating Tot`) &&
    have($item`li'l ninja costume`)
  ) {
    return $familiar`Trick-or-Treating Tot`;
  }

  if (!bestNonCheerleaderFairy) {
    const viableFairies = Familiar.all().filter(
      (f) =>
        have(f) &&
        findFairyMultiplier(f) &&
        f !== $familiar`Steam-Powered Cheerleader` &&
        !f.physicalDamage &&
        !f.elementalDamage,
    );

    const highestFairyMult = findFairyMultiplier(
      maxBy(viableFairies, (f) =>
        f === $familiar`Jill-of-All-Trades` && have($item`toy Cupid bow`)
          ? 1 // Ignore LED candle if we have TCB
          : findFairyMultiplier(f),
      ),
    );
    const goodFairies = viableFairies.filter(
      (f) => findFairyMultiplier(f) === highestFairyMult,
    );

    if (
      have($familiar`Reagnimated Gnome`) &&
      !have($item`gnomish housemaid's kgnee`) &&
      !get("_garbo_triedForKgnee", false)
    ) {
      const current = myFamiliar();
      useFamiliar($familiar`Reagnimated Gnome`);
      visitUrl("arena.php");
      runChoice(4);
      useFamiliar(current);
      set("_garbo_triedForKgnee", true);
    }

    if (have($item`gnomish housemaid's kgnee`) && highestFairyMult === 1) {
      goodFairies.push($familiar`Reagnimated Gnome`);
    }

    const bonuses = [
      ...menu(),
      {
        familiar: $familiar`Reagnimated Gnome`,
        expectedValue: (get("valueOfAdventure") * 70) / 1000,
        leprechaunMultiplier: 0,
        limit: "none",
      },
      {
        familiar: $familiar`Grey Goose`,
        expectedValue: !(get("_meatifyMatterUsed")) ? (15 ** 4) / 400 * getModifier("Familiar Experience") : 0,
        leprechaunMultiplier: 0,
        limit: "none",
      },
      {
        familiar: $familiar`Chest Mimic`,
        expectedValue: getModifier("Familiar Experience") * MEAT_TARGET_MULTIPLIER() * get("valueOfAdventure") / 50,
        leprechaunMultiplier: 1,
        limit: "none",
      },
    ];

    bestNonCheerleaderFairy = maxBy(
      goodFairies,
      (f) => bonuses.find(({ familiar }) => familiar === f)?.expectedValue ?? 0,
    );
  }

  if (
    have($familiar`Steam-Powered Cheerleader`) &&
    findFairyMultiplier($familiar`Steam-Powered Cheerleader`) >
      findFairyMultiplier(bestNonCheerleaderFairy)
  ) {
    return $familiar`Steam-Powered Cheerleader`;
  }

  return bestNonCheerleaderFairy;
}
