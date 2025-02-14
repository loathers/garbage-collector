import { Familiar, familiarEquipment } from "kolmafia";
import { findLeprechaunMultiplier, have, maxBy, ToyCupidBow } from "libram";
import { garboValue } from "../garboValue";
import { GeneralFamiliar } from "./lib";
import { estimatedGarboTurns } from "../turns";

export function getToyCupidBowFamiliars(): GeneralFamiliar[] {
  const fam = Familiar.all().filter((f) => {
    const equipment = familiarEquipment(f);
    return (
      equipment.tradeable === true &&
      have(f) &&
      !ToyCupidBow.familiarsToday().includes(f)
    );
  });

  const bestFamiliar = maxBy(fam, (f) => garboValue(familiarEquipment(f)));

  return [
    {
      familiar: bestFamiliar,
      worksOnFreeRun: true,
      expectedValue:
        estimatedGarboTurns() >= 5
          ? garboValue(familiarEquipment(bestFamiliar)) / 5
          : 0,
      leprechaunMultiplier: findLeprechaunMultiplier(bestFamiliar),
      limit: "none",
    },
  ];
}
