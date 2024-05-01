import {
  cliExecute,
  equippedItem,
  Familiar,
  familiarEquipment,
  familiarWeight,
  Item,
  myFamiliar,
  numericModifier,
  print,
  Slot,
  useFamiliar,
  weightAdjustment,
} from "kolmafia";
import {
  $familiar,
  $familiars,
  $item,
  $items,
  $location,
  $slots,
  findLeprechaunMultiplier,
  get,
  getModifier,
  maxBy,
  sum,
} from "libram";
import { NumericModifier } from "libram/dist/modifierTypes";
import { bonusGear } from "../outfit";
import {
  baseMeat,
  BonusEquipMode,
  EMBEZZLER_MULTIPLIER,
  HIGHLIGHT,
} from "../lib";
import { computeBarfOutfit } from "../outfit/barf";
import { estimatedGarboTurns } from "../turns";
import { getAllDrops } from "./dropFamiliars";
import { getExperienceFamiliarLimit } from "./experienceFamiliars";
import { getAllJellyfishDrops, menu } from "./freeFightFamiliar";
import { GeneralFamiliar, timeToMeatify, turnsAvailable } from "./lib";
import { meatFamiliar } from "./meatFamiliar";
import { garboValue } from "../garboValue";
import { globalOptions } from "../config";
import { shouldChargeMimic } from "../resources/chestMimic";

const ITEM_DROP_VALUE = 0.72;
const MEAT_DROP_VALUE = baseMeat / 100;

type CachedOutfit = {
  weight: number;
  meat: number;
  item: number;
  bonus: number;
};

const outfitCache = new Map<number | Familiar, CachedOutfit>();
const outfitSlots = $slots`hat, back, shirt, weapon, off-hand, pants, acc1, acc2, acc3, familiar`;

const SPECIAL_FAMILIARS_FOR_CACHING = $familiars`Jill-of-All-Trades`;
const outfitCacheKey = (f: Familiar) =>
  SPECIAL_FAMILIARS_FOR_CACHING.includes(f) ? f : findLeprechaunMultiplier(f);

function getCachedOutfitValues(fam: Familiar) {
  const currentValue = outfitCache.get(outfitCacheKey(fam));
  if (currentValue) return currentValue;

  const current = myFamiliar();
  cliExecute("checkpoint");
  try {
    computeBarfOutfit(
      {
        familiar: fam,
        avoid: $items`Kramco Sausage-o-Matic™, cursed magnifying glass, protonic accelerator pack, "I Voted!" sticker, li'l pirate costume, bag of many confections`,
      },
      true,
    ).dress();

    const outfit = outfitSlots.map((slot) => equippedItem(slot));
    const bonuses = bonusGear(BonusEquipMode.EMBEZZLER, false);

    const values = {
      weight: sum(outfit, (eq: Item) => getModifier("Familiar Weight", eq)),
      meat: sum(outfit, (eq: Item) => getModifier("Meat Drop", eq)),
      item: sum(outfit, (eq: Item) => getModifier("Item Drop", eq)),
      bonus: sum(outfit, (eq: Item) => bonuses.get(eq) ?? 0),
    };
    outfitCache.set(outfitCacheKey(fam), values);
    return values;
  } finally {
    useFamiliar(current);
    cliExecute("outfit checkpoint");
  }
}

type MarginalFamiliar = GeneralFamiliar & {
  outfitWeight: number;
  outfitValue: number;
};

const nonOutfitWeightBonus = () =>
  weightAdjustment() -
  sum(outfitSlots, (slot: Slot) =>
    getModifier("Familiar Weight", equippedItem(slot)),
  );

function familiarModifier(
  familiar: Familiar,
  modifier: NumericModifier,
): number {
  const cachedOutfitWeight = getCachedOutfitValues(familiar).weight;
  const totalWeight =
    familiarWeight(familiar) + nonOutfitWeightBonus() + cachedOutfitWeight;
  const equip = familiarEquipment(familiar);

  return SPECIAL_FAMILIARS_FOR_CACHING.includes(familiar)
    ? numericModifier(
        familiar,
        modifier,
        totalWeight - numericModifier(equip, "Familiar Weight"),
        equip,
      )
    : numericModifier(familiar, modifier, totalWeight, $item.none);
}

function familiarAbilityValue(familiar: Familiar) {
  return (
    familiarModifier(familiar, "Meat Drop") * MEAT_DROP_VALUE +
    familiarModifier(familiar, "Item Drop") * ITEM_DROP_VALUE
  );
}

function totalFamiliarValue({
  expectedValue,
  outfitValue,
  familiar,
}: MarginalFamiliar) {
  return expectedValue + outfitValue + familiarAbilityValue(familiar);
}

function turnsNeededFromBaseline(
  baselineToCompareAgainst: MarginalFamiliar,
): (option: MarginalFamiliar) => number {
  return ({ familiar, limit, outfitValue }: MarginalFamiliar) => {
    switch (limit) {
      case "drops":
        return sum(
          getAllDrops(familiar).filter(
            ({ expectedValue }) =>
              outfitValue + familiarAbilityValue(familiar) + expectedValue >
              totalFamiliarValue(baselineToCompareAgainst),
          ),
          ({ expectedTurns }) => expectedTurns,
        );

      case "experience":
        return getExperienceFamiliarLimit(familiar);

      case "none":
        return 0;

      case "special":
        return getSpecialFamiliarLimit({
          familiar,
          outfitValue,
          baselineToCompareAgainst,
        });
    }
  };
}

function calculateOutfitValue(f: GeneralFamiliar): MarginalFamiliar {
  const outfit = getCachedOutfitValues(f.familiar);
  const outfitValue =
    outfit.bonus +
    outfit.meat * MEAT_DROP_VALUE +
    outfit.item * ITEM_DROP_VALUE;
  const outfitWeight = outfit.weight;

  return { ...f, outfitValue, outfitWeight };
}

function extraValue(
  target: MarginalFamiliar,
  meat: MarginalFamiliar,
  jellyfish: MarginalFamiliar | undefined,
) {
  const targetValue = totalFamiliarValue(target);
  const meatFamiliarValue = totalFamiliarValue(meat);

  const jellyfishValue = jellyfish
    ? garboValue($item`stench jelly`) / 20 +
      familiarAbilityValue(jellyfish.familiar) +
      jellyfish.outfitValue
    : 0;
  return Math.max(targetValue - Math.max(meatFamiliarValue, jellyfishValue), 0);
}

export function barfFamiliar(): { familiar: Familiar; extraValue: number } {
  if (timeToMeatify()) {
    return { familiar: $familiar`Grey Goose`, extraValue: 0 };
  }

  if (get("garbo_IgnoreMarginalFamiliars", false)) {
    return { familiar: meatFamiliar(), extraValue: 0 };
  }

  const meat = meatFamiliar();

  const fullMenu = menu({
    canChooseMacro: true,
    location: $location`Barf Mountain`,
    includeExperienceFamiliars: false,
  }).map(calculateOutfitValue);

  const meatFamiliarEntry = fullMenu.find(({ familiar }) => familiar === meat);

  if (!meatFamiliarEntry) {
    throw new Error("Something went wrong when initializing familiars!");
  }

  const meatFamiliarValue = totalFamiliarValue(meatFamiliarEntry);
  const viableMenu = fullMenu.filter(
    (f) => totalFamiliarValue(f) > meatFamiliarValue,
  );

  if (viableMenu.every(({ limit }) => limit !== "none")) {
    const turnsNeeded = sum(
      viableMenu,
      turnsNeededFromBaseline(meatFamiliarEntry),
    );

    if (turnsNeeded < turnsAvailable()) {
      const shrubAvailable = viableMenu.some(
        ({ familiar }) => familiar === $familiar`Crimbo Shrub`,
      );
      return {
        familiar: shrubAvailable ? $familiar`Crimbo Shrub` : meat,
        extraValue: 0,
      };
    }
  }

  if (viableMenu.length === 0) {
    return { familiar: meat, extraValue: 0 };
  }

  const best = maxBy(viableMenu, totalFamiliarValue);

  const familiarPrintout = ({
    expectedValue,
    familiar,
    outfitValue,
  }: MarginalFamiliar) =>
    `(expected value of ${expectedValue.toFixed(
      1,
    )} from familiar drops, ${familiarAbilityValue(familiar).toFixed(
      1,
    )} from familiar abilities and ${outfitValue.toFixed(1)} from outfit)`;

  print(
    `Choosing to use ${best.familiar} ${familiarPrintout(best)} over ${
      meatFamiliarEntry.familiar
    } ${familiarPrintout(meatFamiliarEntry)}.`,
    HIGHLIGHT,
  );

  const jellyfish = fullMenu.find(
    ({ familiar }) => familiar === $familiar`Space Jellyfish`,
  );

  return {
    familiar: best.familiar,
    extraValue: extraValue(best, meatFamiliarEntry, jellyfish),
  };
}

function getSpecialFamiliarLimit({
  familiar,
  outfitValue,
  baselineToCompareAgainst,
}: {
  familiar: Familiar;
  outfitValue: number;
  baselineToCompareAgainst: GeneralFamiliar & {
    outfitWeight: number;
    outfitValue: number;
  };
}): number {
  switch (familiar) {
    case $familiar`Space Jellyfish`:
      return sum(
        getAllJellyfishDrops().filter(
          ({ expectedValue }) =>
            outfitValue + familiarAbilityValue(familiar) + expectedValue >
            totalFamiliarValue(baselineToCompareAgainst),
        ),
        ({ turnsAtValue }) => turnsAtValue,
      );

    case $familiar`Crimbo Shrub`:
      return Math.ceil(estimatedGarboTurns() / 100);

    // If we're going to ascend, Chest Mimic can't be leveled before the next embezzler chain
    // If we're not going to ascend, Chest Mimic shouldn't be charged beyond what it can spit out tomorrow
    case $familiar`Chest Mimic`:
      return globalOptions.ascend
        ? 0
        : !shouldChargeMimic()
        ? 0
        : $familiar`Chest Mimic`.experience < 550
        ? ((get("valueOfAdventure") * EMBEZZLER_MULTIPLIER()) / 50) *
          getModifier("Familiar Experience")
        : 0;

    default:
      return 0;
  }
}
