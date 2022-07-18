import {
  Effect,
  equippedItem,
  Familiar,
  familiarWeight,
  inebrietyLimit,
  Item,
  myInebriety,
  numericModifier,
  Slot,
  useFamiliar,
  weightAdjustment,
} from "kolmafia";
import {
  $familiar,
  $item,
  $items,
  $slots,
  findLeprechaunMultiplier,
  get,
  getActiveEffects,
  getModifier,
  have,
  Requirement,
  sum,
} from "libram";
import { NumericModifier } from "libram/dist/modifierTypes";
import { bonusGear } from "../dropsgear";
import { meatOutfit } from "../outfit";
import { garboValue } from "../session";
import getConstantValueFamiliars from "./constantValueFamiliars";
import getDropFamiliars from "./dropFamiliars";
import getExperienceFamiliars from "./experienceFamiliars";
import { menu } from "./freeFightFamiliar";
import { GeneralFamiliar } from "./lib";
import MeatFamiliar from "./meatFamiliar";

type CachedOutfit = {
  weight: number;
  meat: number;
  bonus: number;
};

const outfitCache = new Map<number, CachedOutfit>();
const outfitSlots = $slots`hat, back, shirt, weapon, off-hand, pants, acc1, acc2, acc3, familiar`;

function getCachedOutfitValues(fam: Familiar) {
  const lepMult = findLeprechaunMultiplier(fam);
  const currentValue = outfitCache.get(lepMult);
  if (currentValue) return currentValue;

  useFamiliar(fam);
  meatOutfit(
    false,
    new Requirement([], {
      preventEquip: $items`Kramco Sausage-o-Matic™, cursed magnifying glass, protonic accelerator pack, "I Voted!" sticker`,
    })
  );

  const outfit = outfitSlots.map((slot) => equippedItem(slot));
  const bonuses = bonusGear("barf");

  const values = {
    weight: sum(outfit, (eq: Item) => getModifier("Familiar Weight", eq)),
    meat: sum(outfit, (eq: Item) => getModifier("Meat Drop", eq)),
    bonus: sum(outfit, (eq: Item) => bonuses.get(eq) ?? 0),
  };
  outfitCache.set(lepMult, values);
  return values;
}

function marginalMenu() {
  const familiarMenu = menu();

  if (have($familiar`Space Jellyfish`) && myInebriety() <= inebrietyLimit()) {
    const jellyfishEntry = {
      familiar: $familiar`Space Jellyfish`,
      expectedValue:
        garboValue($item`stench jelly`) /
        (get("_spaceJellyfishDrops") < 5 ? get("_spaceJellyfishDrops") + 1 : 20),
      leprechaunMultiplier: 0,
      limit: "none",
    };

    familiarMenu.push(jellyfishEntry);
  }

  return familiarMenu;
}

type MarginalFamiliar = GeneralFamiliar & { marginalValue: number };
export function setBarfFamiliar(): void {
  if (get("garboIgnoreMarginalFamiliars", false)) useFamiliar(MeatFamiliar.familiar());

  const effectWeight = sum(getActiveEffects(), (eff: Effect) =>
    getModifier("Familiar Weight", eff)
  );
  const outfitWeight = sum(outfitSlots, (slot: Slot) =>
    getModifier("Familiar Weight", equippedItem(slot))
  );
  const passiveSkillWeight = weightAdjustment() - effectWeight - outfitWeight;

  const familiarModifier = (familiar: Familiar, modifier: NumericModifier) => {
    const outfitWeight = getCachedOutfitValues(familiar).weight;

    const totalWeight = familiarWeight(familiar) + passiveSkillWeight + effectWeight + outfitWeight;

    return numericModifier(familiar, modifier, totalWeight, $item`none`);
  };
}
