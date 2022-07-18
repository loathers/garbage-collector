import { Familiar, inebrietyLimit, myInebriety } from "kolmafia";
import { $familiar, $item, findFairyMultiplier, findLeprechaunMultiplier, have } from "libram";

let fam: Familiar;

function findBestLeprechauns(): Familiar[] {
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

function findBestLeprechaun(): Familiar {
  return findBestLeprechauns().sort((a, b) => findFairyMultiplier(b) - findFairyMultiplier(a))[0];
}

export function setBestLeprechaun(): void {
  fam = findBestLeprechaun();
}

export function meatFamiliar(): Familiar {
  if (!fam) {
    if (
      myInebriety() > inebrietyLimit() &&
      have($familiar`Trick-or-Treating Tot`) &&
      have($item`li'l pirate costume`)
    ) {
      fam = $familiar`Trick-or-Treating Tot`;
    } else if (have($familiar`Robortender`)) {
      fam = $familiar`Robortender`;
    } else {
      setBestLeprechaun();
    }
  }
  return fam;
}
