import { Familiar, Item } from "kolmafia";
import {
  CrownOfThrones,
  findFairyMultiplier,
  findLeprechaunMultiplier,
  sum,
  sumNumbers,
} from "libram";
import { garboAverageValue, garboValue } from "../garboValue";
import { BonusEquipMode, modeUseLimitedDrops, modeValueOfItem, modeValueOfMeat } from "../lib";

function valueBjornModifiers(
  mode: BonusEquipMode,
  familiar: Familiar,
): (ridingFamiliar: Familiar) => number {
  const meatValue = modeValueOfMeat(mode);
  const leprechaunMultiplier = findLeprechaunMultiplier(familiar);
  const leprechaunCoefficient =
    meatValue * (2 * leprechaunMultiplier + Math.sqrt(leprechaunMultiplier));

  const itemValue = modeValueOfItem(mode);
  const fairyMultiplier = findFairyMultiplier(familiar);
  const fairyCoefficient = itemValue * (fairyMultiplier + Math.sqrt(fairyMultiplier) / 2);

  return CrownOfThrones.createModifierValueFunction(["Familiar Weight", "Meat Drop", "Item Drop"], {
    "Familiar Weight": (mod) => mod * (fairyCoefficient + leprechaunCoefficient),
    "Item Drop": (mod) => mod * itemValue,
    "Meat Drop": (mod) => mod * meatValue,
  });
}

function dropsValueFunction(drops: Item[] | Map<Item, number>): number {
  return Array.isArray(drops)
    ? garboAverageValue(...drops)
    : sum([...drops.entries()], ([item, quantity]) => quantity * garboValue(item)) /
        sumNumbers([...drops.values()]);
}

export function valueRider(
  mode: BonusEquipMode,
  familiar: Familiar,
  rider: CrownOfThrones.FamiliarRider,
): number {
  const valueOfDrops =
    rider.dropPredicate?.() ?? true
      ? rider.probability *
        (typeof rider.drops === "number" ? rider.drops : dropsValueFunction(rider.drops))
      : 0;
  const valueOfModifier = valueBjornModifiers(mode, familiar)(rider.familiar);
  return valueOfDrops + valueOfModifier;
}

export function chooseBjorn(
  mode: BonusEquipMode,
  familiar: Familiar,
  sim = false,
): { familiar: Familiar; value: number } {
  const leprechaunMultiplier = findLeprechaunMultiplier(familiar);
  const fairyMultiplier = findFairyMultiplier(familiar);
  const ignoreLimitedDrops = sim || !modeUseLimitedDrops(mode);

  const key = `Leprechaun:${leprechaunMultiplier.toFixed(2)};Fairy:${fairyMultiplier.toFixed(
    2,
  )};ignoreLimitedDrops:${ignoreLimitedDrops}`;

  if (!CrownOfThrones.hasRiderMode(key)) {
    CrownOfThrones.createRiderMode(key, {
      ignoreLimitedDrops,
      modifierValueFunction: valueBjornModifiers(mode, familiar),
      dropsValueFunction,
    });
  }

  const result = CrownOfThrones.pickRider(key);

  if (!result) throw new Error(`Unable to choose rider for key ${key}`);

  return {
    familiar: result.familiar,
    value: CrownOfThrones.valueRider(
      result,
      valueBjornModifiers(mode, familiar),
      dropsValueFunction,
    ),
  };
}
