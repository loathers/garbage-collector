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

function findBestLeprechauns(excludedFamiliars: Familiar[] = []): Familiar[] {
  const validFamiliars = Familiar.all().filter(
    (f) =>
      have(f) &&
      f !== $familiar`Ghost of Crimbo Commerce` &&
      !excludedFamiliars.includes(f),
  );
  if (!validFamiliars.length) return [];

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

function findBestLeprechaun(excludedFamiliars: Familiar[] = []): Familiar {
  const candidates = findBestLeprechauns(excludedFamiliars);
  return candidates.length > 0
    ? maxBy(candidates, findFairyMultiplier)
    : $familiar.none;
}

export function setBestLeprechaunAsMeatFamiliar(): void {
  fam = findBestLeprechaun();
}

export function meatFamiliar(): Familiar {
  return (fam ??=
    $familiars`Robortender, Jill-of-All-Trades`.find(have) ??
    findBestLeprechaun());
}

const familiarsThatNeedEquipment = $familiars`Jill-of-All-Trades`;

export function meatFamiliarIgnoringEquipment(): Familiar {
  const fam = meatFamiliar();
  if (!familiarsThatNeedEquipment.includes(fam)) return fam;
  const best = findBestLeprechaun(familiarsThatNeedEquipment);
  return best === $familiar.none ? fam : best;
}
