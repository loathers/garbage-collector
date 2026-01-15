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
  SkeletonOfCrimboPast,
  sum,
  totalFamiliarWeight,
  ToyCupidBow,
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
import {
  GeneralFamiliar,
  getUsedTcbFamiliars,
  tcbTurnsLeft,
  tcbValue,
  timeToMeatify,
  turnsAvailable,
} from "./lib";
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
    // Derives its value from famexp and requires _much_ more famexp than other exp familiars
    $familiar`Chest Mimic`,
    {
      extraValue: ({ famexp }) =>
        (famexp * MEAT_TARGET_MULTIPLIER() * get("valueOfAdventure")) / 50,
    },
  ],
  // Uniquely required to equip its fam equip to meaningfully have value
  [$familiar`Jill-of-All-Trades`, { equip: $item`LED candle` }],
  // Derives its value irregularly from +famweight
  [
    $familiar`Mini Kiwi`,
    {
      extraValue: ({ weight }) =>
        clamp(
          (weight + totalFamiliarWeight($familiar`Mini Kiwi`, false)) * 0.005,
          0,
          1,
        ) * garboValue($item`mini kiwi`),
    },
  ],
]);

const outfitCacheKey = (f: Familiar) =>
  SPECIAL_FAMILIARS_FOR_CACHING.has(f) ? f : findLeprechaunMultiplier(f);

function getCachedOutfitValues(fam: Familiar) {
  const cacheKey = outfitCacheKey(fam);
  const currentValue = outfitCache.get(cacheKey);
  if (currentValue) return currentValue;

  const current = myFamiliar();
  cliExecute("checkpoint");
  try {
    computeBarfOutfit(
      {
        familiar: fam,
        avoid: $items`Kramco Sausage-o-Matic™, cursed magnifying glass, protonic accelerator pack, "I Voted!" sticker, li'l pirate costume, bag of many confections, bat wings, toy Cupid bow`,
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
    outfitCache.set(cacheKey, values);
    return values;
  } finally {
    useFamiliar(current);
    cliExecute("outfit checkpoint");
  }
}

type MarginalFamiliar = GeneralFamiliar & {
  // How much weight do we get on our outfit when we run this familiar?
  outfitWeight: number;
  // What's the total non-familiar value of this outfit?
  outfitValue: number;
  // How many extra turns do we expect to have racked up on this familiar by the time we run it?
  bonusTurns?: number;
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
  tcbFamiliars: Set<Familiar>,
): (option: MarginalFamiliar) => number {
  return ({ familiar, limit, outfitValue, bonusTurns }: MarginalFamiliar) => {
    switch (limit) {
      case "drops":
        return (
          sum(
            getAllDrops(familiar).filter(
              ({ expectedValue }) =>
                outfitValue + familiarAbilityValue(familiar) + expectedValue >
                totalFamiliarValue(baselineToCompareAgainst),
            ),
            "expectedTurns",
          ) - (bonusTurns ?? 0)
        );

      case "experience":
        return getExperienceFamiliarLimit(familiar) - (bonusTurns ?? 0);

      case "none":
        return 0;

      case "cupid":
        return tcbTurnsLeft(familiar, tcbFamiliars) - (bonusTurns ?? 0);

      case "special":
        return (
          getSpecialFamiliarLimit({
            familiar,
            outfitValue,
            baselineToCompareAgainst,
          }) - (bonusTurns ?? 0)
        );
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

export function barfFamiliar(equipmentForced: boolean): {
  familiar: Familiar;
  extraValue: number;
} {
  // Meatify is basically always the most valuable thing we can do, to the point of not even counting as a marginal familiar
  if (timeToMeatify()) {
    return { familiar: $familiar`Grey Goose`, extraValue: 0 };
  }

  // Luddite mode users get off here
  if (get("garbo_IgnoreMarginalFamiliars", false)) {
    return { familiar: meatFamiliar(), extraValue: 0 };
  }

  const meat = meatFamiliar();

  const usedTcbFamiliars = getUsedTcbFamiliars();

  const fullMenu = menu($location`Barf Mountain`, {
    canChooseMacro: true,
    includeExperienceFamiliars: true,
    mode: "barf",
  }).flatMap((generalFamiliar) => {
    // Here we do two things:
    // * transform `GeneralFamiliar`s into `MarginalFamiliar`s, which carry with them the total value of the outfit you'd wear
    // * "double up" on familiars for which the toy Cupid bow is available
    const normal = calculateOutfitValue(generalFamiliar);
    if (
      normal.limit === "cupid" || // If we're already dealing with one of our generated toy cupid bow picks
      equipmentForced || // If we're unable to equip the toy cupid bow
      !ToyCupidBow.have() || // If we don't have the toy cupid bow
      usedTcbFamiliars.has(generalFamiliar.familiar) // If we've already gotten the thing
    ) {
      return normal;
    }
    const tcb = calculateOutfitValue({
      ...generalFamiliar,
      expectedValue:
        generalFamiliar.expectedValue +
        tcbValue(generalFamiliar.familiar, usedTcbFamiliars, false, true),
      limit: "cupid",
    });
    if (tcb.expectedValue >= normal.expectedValue) {
      return [
        tcb,
        {
          ...normal,
          // Account for the already-burned TCB turns when calculating the limit for the "normal" entry for the familiar
          bonusTurns: tcbTurnsLeft(generalFamiliar.familiar, usedTcbFamiliars),
        },
      ];
    }
    return normal;
  });

  const meatFamiliarEntry = fullMenu.find(({ familiar }) => familiar === meat);

  if (!meatFamiliarEntry) {
    throw new Error("Something went wrong when initializing familiars!");
  }

  const meatFamiliarValue = totalFamiliarValue(meatFamiliarEntry);
  // Ultimately, using our meat familiar all day is the default behavior
  // so any familiar worse than that isn't worth spending any time thinking about
  const viableMenu = fullMenu.filter(
    (f) => totalFamiliarValue(f) > meatFamiliarValue,
  );

  if (viableMenu.length === 0) {
    return { familiar: meat, extraValue: 0 };
  }

  // Determine the baseline for how good a familiar needs to be to be run--either an unlimited familiar, or our meat familiar
  const unlimitedCruisingFamiliars = viableMenu.filter(
    ({ limit }) => limit === "none",
  );
  const cruisingFamiliar = unlimitedCruisingFamiliars.length
    ? maxBy(unlimitedCruisingFamiliars, totalFamiliarValue)
    : meatFamiliarEntry;

  const turnsNeeded = sum(
    viableMenu,
    turnsNeededFromBaseline(cruisingFamiliar, usedTcbFamiliars),
  );

  // If there aren't enough turns left in the day to get value out of fams that aren't our "cruising" familiar, just return that
  // With a special exception for crimbo shrub
  if (turnsNeeded < turnsAvailable()) {
    const shrubAvailable = viableMenu.some(
      ({ familiar }) => familiar === $familiar`Crimbo Shrub`,
    );
    return {
      familiar: shrubAvailable
        ? $familiar`Crimbo Shrub`
        : cruisingFamiliar.familiar,
      extraValue: 0,
    };
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
        "turnsAtValue",
      );

    case $familiar`Crimbo Shrub`:
      return Math.ceil(estimatedGarboTurns() / 100);

    case $familiar`Skeleton of Crimbo Past`:
      return (
        clamp(100 - get("_knuckleboneDrops"), 0, 100) /
        SkeletonOfCrimboPast.expectedBones($location`Barf Mountain`)
      );

    default:
      return 0;
  }
}
