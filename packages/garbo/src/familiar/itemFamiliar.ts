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
import { shouldChargeMimic } from "../resources";
import { MEAT_TARGET_MULTIPLIER } from "../lib";

let bestNonCheerleaderFairy: Familiar;

export function bestFairy(): Familiar {
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
      maxBy(viableFairies, findFairyMultiplier),
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
      ...menu({ includeExperienceFamiliars: false }),
      {
        familiar: $familiar`Reagnimated Gnome`,
        expectedValue: (get("valueOfAdventure") * 70) / 1000,
        leprechaunMultiplier: 0,
        limit: "none",
      },
      {
        familiar: $familiar`Chest Mimic`,
        expectedValue: shouldChargeMimic(true)
          ? ((MEAT_TARGET_MULTIPLIER() * get("valueOfAdventure")) / 400) *
            getModifier("Familiar Experience")
          : 0,
        leprechaunMultiplier: 1,
        limit: "none",
      },
      {
        familiar: $familiar`Pocket Professor`,
        expectedValue:
          !get("_thesisDelivered") &&
          $familiar`Pocket Professor`.experience < 400
            ? ((11 * get("valueOfAdventure")) / 400) *
              getModifier("Familiar Experience")
            : 0,
        leprechaunMultiplier: 1,
        limit: "none",
      },
      {
        familiar: $familiar`Grey Goose`,
        expectedValue:
          !get("_meatifyMatterUsed") &&
          $familiar`Pocket Professor`.experience < 400
            ? getModifier("Familiar Experience") * (15 ** 4 / 400)
            : 0, // Meatify Matter is worth 15 ** 4, each xp is worth 1/400th of that
        leprechaunMultiplier: 0,
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
