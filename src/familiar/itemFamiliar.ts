import { Familiar } from "kolmafia";
import { $familiar, $item, findFairyMultiplier, get, have } from "libram";
import { menu } from "./freeFightFamiliar";

let bestNonCheerleaderFairy: Familiar;

export function bestFairy(): Familiar {
  if (have($familiar`Trick-or-Treating Tot`) && have($item`li'l ninja costume`)) {
    return $familiar`Trick-or-Treating Tot`;
  }

  if (
    have($familiar`Steam-Powered Cheerleader`) &&
    findFairyMultiplier($familiar`Steam-Powered Cheerleader`) > 1.25
  ) {
    return $familiar`Steam-Powered Cheerleader`;
  }

  if (!bestNonCheerleaderFairy) {
    const viableFairies = Familiar.all()
      .filter(
        (f) => have(f) && findFairyMultiplier(f) && f !== $familiar`Steam-Powered Cheerleader`
      )
      .sort((a, b) => findFairyMultiplier(b) - findFairyMultiplier(a));

    const highestFairyMult = findFairyMultiplier(viableFairies[0]);
    const goodFairies = viableFairies.filter((f) => findFairyMultiplier(f) === highestFairyMult);

    const bonuses = [
      ...menu(true, false),
      {
        familiar: $familiar`Reagnimated Gnome`,
        expectedValue: (get("valueOfAdventure") * 70) / 1000,
        leprechaunMultiplier: 0,
        limit: "none",
      },
    ];

    goodFairies.sort(
      (a, b) =>
        bonuses.find(({ familiar }) => familiar === b)?.expectedValue ??
        0 - (bonuses.find(({ familiar }) => familiar === a)?.expectedValue ?? 0)
    );

    bestNonCheerleaderFairy = goodFairies[0];
  }

  return bestNonCheerleaderFairy;
}
