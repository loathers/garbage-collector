import {
  equippedItem,
  Familiar,
  familiarWeight,
  inebrietyLimit,
  Item,
  myInebriety,
  numericModifier,
  print,
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
  getModifier,
  have,
  Requirement,
  sum,
} from "libram";
import { NumericModifier } from "libram/dist/modifierTypes";
import { bonusGear } from "../dropsgear";
import { estimatedTurns } from "../embezzler";
import { estimatedFreeFights } from "../fights";
import { baseMeat, HIGHLIGHT } from "../lib";
import { meatOutfit } from "../outfit";
import { garboValue } from "../session";
import { getAllDrops } from "./dropFamiliars";
import { getExperienceFamiliarLimit } from "./experienceFamiliars";
import { menu } from "./freeFightFamiliar";
import { GeneralFamiliar } from "./lib";
import MeatFamiliar from "./meatFamiliar";

type CachedOutfit = {
  weight: number;
  meat: number;
  item: number;
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
    item: sum(outfit, (eq: Item) => getModifier("Item Drop", eq)),
    bonus: sum(outfit, (eq: Item) => bonuses.get(eq) ?? 0),
  };
  outfitCache.set(lepMult, values);
  return values;
}

function marginalMenu() {
  const familiarMenu = menu();

  if (have($familiar`Space Jellyfish`) && myInebriety() <= inebrietyLimit()) {
    familiarMenu.push({
      familiar: $familiar`Space Jellyfish`,
      expectedValue:
        garboValue($item`stench jelly`) /
        (get("_spaceJellyfishDrops") < 5 ? get("_spaceJellyfishDrops") + 1 : 20),
      leprechaunMultiplier: 0,
      limit: "none",
    });
  }

  return familiarMenu;
}

type MarginalFamiliar = GeneralFamiliar & { outfitValue: number };

function marginalizeFamiliar(f: GeneralFamiliar): MarginalFamiliar {
  const currentOutfitWeight = sum(outfitSlots, (slot: Slot) =>
    getModifier("Familiar Weight", equippedItem(slot))
  );
  const passiveWeight = weightAdjustment() - currentOutfitWeight;

  const familiarModifier = (familiar: Familiar, modifier: NumericModifier) => {
    const cachedOutfitWeight = getCachedOutfitValues(familiar).weight;

    const totalWeight = familiarWeight(familiar) + passiveWeight + cachedOutfitWeight;

    return numericModifier(familiar, modifier, totalWeight, $item`none`);
  };

  const outfit = getCachedOutfitValues(f.familiar);
  const outfitValue =
    outfit.bonus +
    ((outfit.meat + familiarModifier(f.familiar, "Meat Drop")) * baseMeat) / 100 +
    (outfit.item + familiarModifier(f.familiar, "Item Drop")) * 0.72;

  return { ...f, outfitValue };
}
export function chooseBarfFamiliar(): Familiar {
  if (get("garboIgnoreMarginalFamiliars", false)) return MeatFamiliar.familiar();

  const fullMenu = marginalMenu().map(marginalizeFamiliar);

  const meatFamiliar = fullMenu.find(({ familiar }) => familiar === MeatFamiliar.familiar());

  if (!meatFamiliar) throw new Error("Something went wrong when initializing familiars!");

  const viableMenu = fullMenu.filter(
    ({ expectedValue, outfitValue }) =>
      expectedValue + outfitValue > meatFamiliar.expectedValue + meatFamiliar.outfitValue
  );

  if (viableMenu.every(({ limit }) => limit !== "none")) {
    const turnsNeeded = sum(viableMenu, (option: MarginalFamiliar) =>
      turnsNeededForFamiliar(option, meatFamiliar.expectedValue + meatFamiliar.outfitValue)
    );

    if (turnsNeeded < estimatedTurns() + estimatedFreeFights()) {
      return MeatFamiliar.familiar();
    }
  }

  const best = viableMenu.reduce((a, b) =>
    a.expectedValue + a.outfitValue > b.expectedValue + b.outfitValue ? a : b
  );

  print(
    HIGHLIGHT,
    `Choosing to use ${best.familiar} (expected value of ${
      best.expectedValue + best.outfitValue - meatFamiliar.outfitValue
    }) over ${meatFamiliar.familiar} (expected value of ${meatFamiliar.expectedValue}).`
  );

  return best.familiar;
}

function turnsNeededForFamiliar(
  { familiar, limit, outfitValue }: MarginalFamiliar,
  baselineToCompareAgainst: number
): number {
  switch (limit) {
    case "drops":
      return sum(
        getAllDrops(familiar).filter(
          (x) => x.expectedValue + outfitValue > baselineToCompareAgainst
        ),
        ({ expectedTurns }) => expectedTurns
      );

    case "experience":
      return getExperienceFamiliarLimit(familiar);

    case "none":
      return 0;
  }
}
