import { Familiar } from "kolmafia";
import {
  $familiar,
  $familiars,
  findFairyMultiplier,
  findLeprechaunMultiplier,
  have,
  maxBy,
} from "libram";

let fam: Familiar;

function findBestLeprechauns(): Familiar[] {
  const validFamiliars = Familiar.all().filter(
    (f) => have(f) && f !== $familiar`Ghost of Crimbo Commerce`,
  );

  validFamiliars.sort(
    (a, b) => findLeprechaunMultiplier(b) - findLeprechaunMultiplier(a),
  );

  const bestLepMult = findLeprechaunMultiplier(validFamiliars[0]);
  const firstBadLeprechaun = validFamiliars.findIndex(
    (f) => findLeprechaunMultiplier(f) < bestLepMult,
  );

  if (firstBadLeprechaun === -1) return validFamiliars;
  return validFamiliars.slice(0, firstBadLeprechaun);
}

function findBestLeprechaun(): Familiar {
  return maxBy(findBestLeprechauns(), findFairyMultiplier);
}

export function setBestLeprechaunAsMeatFamiliar(): void {
  fam = findBestLeprechaun();
}

export function meatFamiliar(): Familiar {
  return (fam ??=
    $familiars`Robortender, Jill-of-All-Trades`.find(have) ??
    findBestLeprechaun());
}
