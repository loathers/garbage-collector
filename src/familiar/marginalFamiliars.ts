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
import { baseMeat, HIGHLIGHT } from "../lib";
import { meatOutfit } from "../outfit";
import { garboValue } from "../session";
import { getAllDrops } from "./dropFamiliars";
import { getExperienceFamiliarLimit } from "./experienceFamiliars";
import { menu } from "./freeFightFamiliar";
import { GeneralFamiliar, timeToMeatify } from "./lib";
import { meatFamiliar } from "./meatFamiliar";

const ITEM_DROP_VALUE = 0.72;
const MEAT_DROP_VALUE = baseMeat / 100;

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

type MarginalFamiliar = GeneralFamiliar & { outfitWeight: number; outfitValue: number };

const nonOutfitWeightBonus = () =>
  weightAdjustment() -
  sum(outfitSlots, (slot: Slot) => getModifier("Familiar Weight", equippedItem(slot)));

function familiarModifier(familiar: Familiar, modifier: NumericModifier): number {
  const cachedOutfitWeight = getCachedOutfitValues(familiar).weight;
  const totalWeight = familiarWeight(familiar) + nonOutfitWeightBonus() + cachedOutfitWeight;

  return numericModifier(familiar, modifier, totalWeight, $item`none`);
}

function familiarAbilityValue(familiar: Familiar) {
  return (
    familiarModifier(familiar, "Meat Drop") * MEAT_DROP_VALUE +
    familiarModifier(familiar, "Item Drop") * ITEM_DROP_VALUE
  );
}

function totalFamiliarValue({ expectedValue, outfitValue, familiar }: MarginalFamiliar) {
  return expectedValue + outfitValue + familiarAbilityValue(familiar);
}

function turnsNeededForFamiliar(
  { familiar, limit, outfitValue }: MarginalFamiliar,
  baselineToCompareAgainst: MarginalFamiliar
): number {
  switch (limit) {
    case "drops":
      return sum(
        getAllDrops(familiar).filter(
          ({ expectedValue }) =>
            outfitValue + familiarAbilityValue(familiar) + expectedValue >
            totalFamiliarValue(baselineToCompareAgainst)
        ),
        ({ expectedTurns }) => expectedTurns
      );

    case "experience":
      return getExperienceFamiliarLimit(familiar);

    case "none":
      return 0;
  }
}

function calculateOutfitValue(f: GeneralFamiliar): MarginalFamiliar {
  const outfit = getCachedOutfitValues(f.familiar);
  const outfitValue = outfit.bonus + outfit.meat * MEAT_DROP_VALUE + outfit.item * ITEM_DROP_VALUE;
  const outfitWeight = outfit.weight;

  return { ...f, outfitValue, outfitWeight };
}
export function barfFamiliar(): Familiar {
  if (timeToMeatify()) return $familiar`Grey Goose`;
  if (get("garbo_IgnoreMarginalFamiliars", false)) return meatFamiliar();

  // Right now, this menu lies, and says that we cannot customize the macro used.
  // This is because the Grey Goose has bespoke handling, and the Crimbo Shrub needs bespoke handling later on.
  // Some day, I hope to right this wrong.
  const baseMenu = menu(false);

  if (have($familiar`Space Jellyfish`) && myInebriety() <= inebrietyLimit()) {
    baseMenu.push({
      familiar: $familiar`Space Jellyfish`,
      expectedValue:
        garboValue($item`stench jelly`) /
        (get("_spaceJellyfishDrops") < 5 ? get("_spaceJellyfishDrops") + 1 : 20),
      leprechaunMultiplier: 0,
      limit: "none",
    });
  }

  const fullMenu = baseMenu.map(calculateOutfitValue);

  const meatFamiliarEntry = fullMenu.find(({ familiar }) => familiar === meatFamiliar());

  if (!meatFamiliarEntry) throw new Error("Something went wrong when initializing familiars!");

  const viableMenu = fullMenu.filter(
    (f) => totalFamiliarValue(f) > totalFamiliarValue(meatFamiliarEntry)
  );

  if (viableMenu.every(({ limit }) => limit !== "none")) {
    const turnsNeeded = sum(viableMenu, (option: MarginalFamiliar) =>
      turnsNeededForFamiliar(option, meatFamiliarEntry)
    );

    if (turnsNeeded < estimatedTurns()) return meatFamiliar();
  }

  if (viableMenu.length === 0) return meatFamiliar();

  const best = viableMenu.reduce((a, b) => (totalFamiliarValue(a) > totalFamiliarValue(b) ? a : b));

  const familiarPrintout = (x: MarginalFamiliar) =>
    `(expected value of ${x.expectedValue.toFixed(1)} from familiar drops, ${familiarAbilityValue(
      x.familiar
    ).toFixed(1)} from familiar abilities and ${x.outfitValue.toFixed(1)} from outfit)`;

  print(
    `Choosing to use ${best.familiar} ${familiarPrintout(best)} over ${
      meatFamiliarEntry.familiar
    } ${familiarPrintout(meatFamiliarEntry)}.`,
    HIGHLIGHT
  );

  return best.familiar;
}
