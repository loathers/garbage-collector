import { Familiar, myFamiliar, runChoice, useFamiliar, visitUrl } from "kolmafia";
import { $familiar, $item, findFairyMultiplier, get, have, set } from "libram";
import { menu } from "./freeFightFamiliar";

let bestNonCheerleaderFairy: Familiar;

export function bestFairy(): Familiar {
  if (have($familiar`Trick-or-Treating Tot`) && have($item`li'l ninja costume`)) {
    return $familiar`Trick-or-Treating Tot`;
  }

  if (!bestNonCheerleaderFairy) {
    const viableFairies = Familiar.all()
      .filter(
        (f) => have(f) && findFairyMultiplier(f) && f !== $familiar`Steam-Powered Cheerleader`
      )
      .sort((a, b) => findFairyMultiplier(b) - findFairyMultiplier(a));

    const highestFairyMult = findFairyMultiplier(viableFairies[0]);
    const goodFairies = viableFairies.filter((f) => findFairyMultiplier(f) === highestFairyMult);

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
    ];

    goodFairies.sort(
      (a, b) =>
        (bonuses.find(({ familiar }) => familiar === b)?.expectedValue ?? 0) -
        (bonuses.find(({ familiar }) => familiar === a)?.expectedValue ?? 0)
    );

    bestNonCheerleaderFairy = goodFairies[0];
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
