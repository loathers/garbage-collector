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
  $monster,
  findFairyMultiplier,
  get,
  have,
  maxBy,
  set,
} from "libram";
import { menu } from "./freeFightFamiliar";
import { getCupidBowValues } from "./toyCupidBowValue";

export function sandwormFamiliar(): Familiar {
  if (
    have($familiar`Trick-or-Treating Tot`) &&
    have($item`li'l ninja costume`) &&
    !have($item`toy Cupid bow`)
  ) {
    return $familiar`Trick-or-Treating Tot`;
  }

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

  if (
    have($item`gnomish housemaid's kgnee`) &&
    highestFairyMult === 1 &&
    !have($item`toy Cupid bow`)
  ) {
    goodFairies.push($familiar`Reagnimated Gnome`);
  }

  const cupidBowValues = getCupidBowValues($monster`giant sandworm`);
  const familiarBonuses = [
    ...menu($monster`giant sandworm`, {
      canChooseMacro: false,
      cupidBowValues,
    }),
    {
      familiar: $familiar`Reagnimated Gnome`,
      expectedValue: (get("valueOfAdventure") * 70) / 1000,
      leprechaunMultiplier: 0,
      limit: "none",
    },
  ];

  const bestNonCheerleaderFairy = maxBy(goodFairies, (fairy) => {
    const familiarBonus = familiarBonuses.find(
      ({ familiar }) => familiar === fairy,
    );
    // The bow is required for sandworm rerolls, so a reset penalty applies
    // even if this fairy also has an ordinary drop or experience benefit.
    return (
      (familiarBonus?.expectedValue ?? 0) +
      (familiarBonus?.limit === "cupid" ? 0 : (cupidBowValues.get(fairy) ?? 0))
    );
  });

  if (
    have($familiar`Steam-Powered Cheerleader`) &&
    findFairyMultiplier($familiar`Steam-Powered Cheerleader`) >
      findFairyMultiplier(bestNonCheerleaderFairy)
  ) {
    return $familiar`Steam-Powered Cheerleader`;
  }

  return bestNonCheerleaderFairy;
}
