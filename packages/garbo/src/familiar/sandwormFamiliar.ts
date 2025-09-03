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
  have,
  maxBy,
  set,
} from "libram";
import { menu } from "./freeFightFamiliar";
import { getUsedTcbFamiliars, tcbValue } from "./lib";

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

  const bonuses = [
    ...menu({
      canChooseMacro: false,
    }),
    {
      familiar: $familiar`Reagnimated Gnome`,
      expectedValue: (get("valueOfAdventure") * 70) / 1000,
      leprechaunMultiplier: 0,
      limit: "none",
    },
  ];

  const tcbFamiliars = getUsedTcbFamiliars();

  const bestNonCheerleaderFairy = maxBy(
    goodFairies,
    (f) =>
      bonuses.find(({ familiar }) => familiar === f)?.expectedValue ??
      tcbValue(f, tcbFamiliars),
  );

  if (
    have($familiar`Steam-Powered Cheerleader`) &&
    findFairyMultiplier($familiar`Steam-Powered Cheerleader`) >
      findFairyMultiplier(bestNonCheerleaderFairy)
  ) {
    return $familiar`Steam-Powered Cheerleader`;
  }

  return bestNonCheerleaderFairy;
}
