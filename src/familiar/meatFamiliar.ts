import { Familiar, inebrietyLimit, myInebriety } from "kolmafia";
import { $familiar, $item, findFairyMultiplier, findLeprechaunMultiplier, have } from "libram";

export default class MeatFamiliar {
  private static fam: Familiar;

  private static findBestLeprechauns(): Familiar[] {
    const validFamiliars = Familiar.all().filter(
      (f) => have(f) && f !== $familiar`Ghost of Crimbo Commerce`
    );

    validFamiliars.sort((a, b) => findLeprechaunMultiplier(b) - findLeprechaunMultiplier(a));

    const bestLepMult = findLeprechaunMultiplier(validFamiliars[0]);
    const firstBadLeprechaun = validFamiliars.findIndex(
      (f) => findLeprechaunMultiplier(f) < bestLepMult
    );

    if (firstBadLeprechaun === -1) return validFamiliars;
    return validFamiliars.slice(0, firstBadLeprechaun - 1);
  }

  private static findBestLeprechaun(): Familiar {
    return MeatFamiliar.findBestLeprechauns().sort(
      (a, b) => findFairyMultiplier(b) - findFairyMultiplier(a)
    )[0];
  }

  static setBestLeprechaun(): void {
    MeatFamiliar.fam = MeatFamiliar.findBestLeprechaun();
  }

  static familiar(): Familiar {
    if (!MeatFamiliar.fam) {
      if (
        myInebriety() > inebrietyLimit() &&
        have($familiar`Trick-or-Treating Tot`) &&
        have($item`li'l pirate costume`)
      ) {
        MeatFamiliar.fam = $familiar`Trick-or-Treating Tot`;
      } else if (have($familiar`Robortender`)) {
        MeatFamiliar.fam = $familiar`Robortender`;
      } else {
        MeatFamiliar.setBestLeprechaun();
      }
    }
    return MeatFamiliar.fam;
  }
}
