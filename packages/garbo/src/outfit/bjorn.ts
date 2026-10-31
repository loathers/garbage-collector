import { Familiar, Item } from "kolmafia";
import {
  CrownOfThrones,
  findFairyMultiplier,
  findLeprechaunMultiplier,
  sum,
  sumNumbers,
} from "libram";
import { garboAverageValue, garboValue } from "../garboValue";
import {
  BonusEquipMode,
  modeUseLimitedDrops,
  modeValueOfItem,
  modeValueOfMeat,
} from "./lib";

function dropsValueFunction(drops: Item[] | Map<Item, number>): number {
  return Array.isArray(drops)
    ? garboAverageValue(...drops)
    : sum(
        [...drops.entries()],
        ([item, quantity]) => quantity * garboValue(item),
      ) / sumNumbers([...drops.values()]);
}

export function chooseBjorn(
  mode: BonusEquipMode,
  familiar: Familiar,
  sim = false,
): { familiar: Familiar; value: number } {
  const leprechaunMultiplier = findLeprechaunMultiplier(familiar);
  const fairyMultiplier = findFairyMultiplier(familiar);
  const ignoreLimitedDrops = sim || !modeUseLimitedDrops(mode);
  const meatValue = modeValueOfMeat(mode);
  const itemValue = modeValueOfItem(mode);
  const [weightCoefficient, meatCoefficient, itemCoefficient] = [
    meatValue * (2 * leprechaunMultiplier + Math.sqrt(leprechaunMultiplier)) +
      itemValue * (fairyMultiplier + Math.sqrt(fairyMultiplier) / 2),
    meatValue,
    itemValue,
  ].map((value) => Math.round(value * 1000) / 1000);
  const modifierValueFunction = CrownOfThrones.createModifierValueFunction(
    ["Familiar Weight", "Meat Drop", "Item Drop"],
    {
      "Familiar Weight": (mod) => mod * weightCoefficient,
      "Meat Drop": (mod) => mod * meatCoefficient,
      "Item Drop": (mod) => mod * itemCoefficient,
    },
  );

  const key = [
    weightCoefficient,
    meatCoefficient,
    itemCoefficient,
    ignoreLimitedDrops,
  ].join(":");

  if (!CrownOfThrones.hasRiderMode(key)) {
    CrownOfThrones.createRiderMode(key, {
      ignoreLimitedDrops,
      modifierValueFunction,
      dropsValueFunction,
    });
  }

  const result = CrownOfThrones.pickRider(key);

  if (!result) {
    throw new Error(`Unable to choose rider for key ${key}`);
  }

  return {
    familiar: result.familiar,
    value: CrownOfThrones.valueRider(
      result,
      modifierValueFunction,
      dropsValueFunction,
      ignoreLimitedDrops,
    ),
  };
}
