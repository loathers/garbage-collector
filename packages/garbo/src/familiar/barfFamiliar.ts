import {
  cliExecute,
  equippedItem,
  Familiar,
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
  $item,
  $items,
  $location,
  $slots,
  clamp,
  findLeprechaunMultiplier,
  get,
  getModifier,
  maxBy,
  sum,
  totalFamiliarWeight,
} from "libram";
import { NumericModifier } from "libram/dist/modifierTypes";
import { bonusGear } from "../outfit";
import {
  baseMeat,
  BonusEquipMode,
  HIGHLIGHT,
  MEAT_TARGET_MULTIPLIER,
} from "../lib";
import { computeBarfOutfit } from "../outfit/barf";
import { estimatedGarboTurns } from "../turns";
import { getAllDrops } from "./dropFamiliars";
import { getExperienceFamiliarLimit } from "./experienceFamiliars";
import { getAllJellyfishDrops, menu } from "./freeFightFamiliar";
import { GeneralFamiliar, timeToMeatify, turnsAvailable } from "./lib";
import { meatFamiliar } from "./meatFamiliar";
import { garboValue } from "../garboValue";

const ITEM_DROP_VALUE = 0.72;
const MEAT_DROP_VALUE = baseMeat() / 100;

type CachedOutfit = {
  weight: number;
  meat: number;
  item: number;
  famexp: number;
  bonus: number;
};

const outfitCache = new Map<number | Familiar, CachedOutfit>();
const outfitSlots = $slots`hat, back, shirt, weapon, off-hand, pants, acc1, acc2, acc3, familiar`;

const SPECIAL_FAMILIARS_FOR_CACHING = new Map<
  Familiar,
  { equip?: Item; extraValue?: (outfit: CachedOutfit) => number }
>([
  [
    $familiar`Chest Mimic`,
    {
      extraValue: ({ famexp }) =>
        (famexp * MEAT_TARGET_MULTIPLIER() * get("valueOfAdventure")) / 50,
    },
  ],
  [$familiar`Jill-of-All-Trades`, { equip: $item`LED candle` }],
  [
    $familiar`Mini Kiwi`,
    {
      extraValue: ({ weight }) =>
        clamp(weight * 0.005, 0, 1) * garboValue($item`mini kiwi`),
    },
  ],
]);

const outfitCacheKey = (f: Familiar) =>
  SPECIAL_FAMILIARS_FOR_CACHING.has(f) ? f : findLeprechaunMultiplier(f);

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
    const bonuses = bonusGear(BonusEquipMode.MEAT_TARGET, false);

    const values = {
      weight: sum(outfit, (eq: Item) => getModifier("Familiar Weight", eq)),
      meat: sum(outfit, (eq: Item) => getModifier("Meat Drop", eq)),
      item: sum(outfit, (eq: Item) => getModifier("Item Drop", eq)),
      famexp: sum(outfit, (eq: Item) => getModifier("Familiar Experience", eq)),
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
    totalFamiliarWeight(familiar, false) +
    nonOutfitWeightBonus() +
    cachedOutfitWeight;
  const { equip } = SPECIAL_FAMILIARS_FOR_CACHING.get(familiar) ?? {};

  return equip
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
    outfit.item * ITEM_DROP_VALUE +
    (SPECIAL_FAMILIARS_FOR_CACHING.get(f.familiar)?.extraValue?.(outfit) ?? 0);
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
    includeExperienceFamiliars: true,
    mode: "barf",
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

    default:
      return 0;
  }
}
