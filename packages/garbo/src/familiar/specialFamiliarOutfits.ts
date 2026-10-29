import type { Outfit } from "grimoire-kolmafia";
import {
  equippedItem,
  Familiar,
  Item,
  numericModifier,
  weightAdjustment,
} from "kolmafia";
import {
  $familiar,
  $item,
  $slots,
  clamp,
  get,
  getModifier,
  sum,
  totalFamiliarWeight,
} from "libram";
import type { NumericModifier } from "libram/dist/modifierTypes";
import { FarmingStrategy } from "../farmingStrategy";
import { garboValue } from "../garboValue";
import { MEAT_TARGET_MULTIPLIER } from "../lib";
import {
  swordDropValue,
  swordItemDropObjective,
} from "../resources/swordOfSWords";

export type CachedOutfit = {
  weight: number;
  meat: number;
  item: number;
  famexp: number;
  bonus: number;
};

export const familiarOutfitSlots = $slots`hat, back, shirt, weapon, off-hand, pants, acc1, acc2, acc3, familiar`;

function familiarWeightWithOutfit(familiar: Familiar, outfitWeight: number) {
  const nonOutfitWeightBonus =
    weightAdjustment() -
    sum(familiarOutfitSlots, (slot) =>
      getModifier("Familiar Weight", equippedItem(slot)),
    );
  return (
    totalFamiliarWeight(familiar, false) + nonOutfitWeightBonus + outfitWeight
  );
}

/** Evaluate a familiar ability using predicted outfit weight and required equipment. */
export function familiarModifierWithOutfit(
  familiar: Familiar,
  modifier: NumericModifier,
  outfitWeight: number,
): number {
  const totalWeight = familiarWeightWithOutfit(familiar, outfitWeight);
  const { equip } = specialFamiliarOutfits.get(familiar) ?? {};
  return equip
    ? numericModifier(
        familiar,
        modifier,
        totalWeight - numericModifier(equip, "Familiar Weight"),
        equip,
      )
    : numericModifier(familiar, modifier, totalWeight, $item.none);
}

type SpecialFamiliarOutfit = {
  /** Equipment required for the familiar's modeled abilities. */
  equip?: Item;
  /** Applied to both simulated and live farming outfits. */
  configureOutfit?: (outfit: Outfit) => void;
  itemDropObjective?: (farmingItemDropValue: number) => {
    valuePerItemDrop: number;
    maximumItemDrop?: number;
  };
  /** Value beyond the familiar's ordinary Meat and Item Drop abilities. */
  extraValue?: (outfit: CachedOutfit) => number;
};

const mimicExperienceValue = () =>
  (MEAT_TARGET_MULTIPLIER() * get("valueOfAdventure")) / 50;

// These familiars need their own cache entries because their outfit requirements
// or valuations cannot be described by their leprechaun multiplier alone.
// Keep this module independent of the familiar selector and outfit builder.
export const specialFamiliarOutfits = new Map<Familiar, SpecialFamiliarOutfit>([
  [
    $familiar`Chest Mimic`,
    {
      configureOutfit: (outfit) => {
        if ($familiar`Chest Mimic`.experience < 550) {
          outfit.modifier.push(`${mimicExperienceValue()} Familiar Experience`);
        }
      },
      extraValue: ({ famexp }) => famexp * mimicExperienceValue(),
    },
  ],
  [
    $familiar`Jill-of-All-Trades`,
    {
      equip: $item`LED candle`,
      configureOutfit: (outfit) => {
        outfit.setModes({ jillcandle: "ultraviolet" });
      },
    },
  ],
  [
    $familiar`Mini Kiwi`,
    {
      extraValue: ({ weight }) =>
        clamp(
          familiarWeightWithOutfit($familiar`Mini Kiwi`, weight) * 0.005,
          0,
          1,
        ) * garboValue($item`mini kiwi`),
    },
  ],
  [
    $familiar`Sword of S Words`,
    {
      itemDropObjective: swordItemDropObjective,
      extraValue: ({ item, weight }) => {
        const monster = get("swordOfSWordsMonster");
        if (!monster) return 0;
        const totalItem =
          item +
          familiarModifierWithOutfit(
            $familiar`Sword of S Words`,
            "Item Drop",
            weight,
          );
        return (
          swordDropValue(totalItem) -
          totalItem * FarmingStrategy.itemDropValue()
        );
      },
    },
  ],
]);
