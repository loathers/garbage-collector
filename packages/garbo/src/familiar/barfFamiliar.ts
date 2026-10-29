import {
  cliExecute,
  equippedItem,
  Familiar,
  Item,
  myFamiliar,
  print,
  useFamiliar,
} from "kolmafia";
import {
  $effect,
  $element,
  $familiar,
  $item,
  $items,
  clamp,
  findLeprechaunMultiplier,
  get,
  getModifier,
  have,
  maxBy,
  SkeletonOfCrimboPast,
  sum,
  ToyCupidBow,
} from "libram";
import { NumericModifier } from "libram/dist/modifierTypes";
import { bonusGear } from "../outfit/dropsgear";
import { HIGHLIGHT } from "../lib";
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
import { FarmingStrategy } from "../farmingStrategy";
import { BonusEquipMode } from "../outfit/lib";
import {
  CachedOutfit,
  familiarModifierWithOutfit,
  familiarOutfitSlots,
  specialFamiliarOutfits,
} from "./specialFamiliarOutfits";

function familiarNeedsBoot(familiar: Familiar): boolean {
  return (
    FarmingStrategy.isUnderwater() &&
    !have($effect`Driving Waterproofly`) &&
    !familiar.underwater
  );
}

const outfitCache = new Map<OutfitCacheKey, CachedOutfit>();

type OutfitCacheKey = number | Familiar | string;

function outfitCacheKey(familiar: Familiar): OutfitCacheKey {
  if (specialFamiliarOutfits.has(familiar)) {
    return familiar;
  }

  const lepMultiplier = findLeprechaunMultiplier(familiar);

  if (!FarmingStrategy.isUnderwater()) {
    return lepMultiplier;
  }

  return `${lepMultiplier}:${familiar.underwater}`;
}

function getCachedOutfitValues(fam: Familiar) {
  const cacheKey = outfitCacheKey(fam);
  const currentValue = outfitCache.get(cacheKey);

  const needsBoot = familiarNeedsBoot(fam);
  if (currentValue) return currentValue;

  const current = myFamiliar();
  cliExecute("checkpoint");
  try {
    computeBarfOutfit(
      {
        familiar: fam,
        equip: needsBoot ? $items`das boot` : [],
        avoid: $items`Kramco Sausage-o-Matic™, cursed magnifying glass, protonic accelerator pack, "I Voted!" sticker, li'l pirate costume, bag of many confections, bat wings, toy Cupid bow`,
      },
      true,
    ).dress();

    const outfit = familiarOutfitSlots.map((slot) => equippedItem(slot));
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

function familiarModifier(
  familiar: Familiar,
  modifier: NumericModifier,
): number {
  return familiarModifierWithOutfit(
    familiar,
    modifier,
    getCachedOutfitValues(familiar).weight,
  );
}

function familiarAbilityValue(familiar: Familiar) {
  return (
    familiarModifier(familiar, "Meat Drop") * FarmingStrategy.meatDropValue() +
    familiarModifier(familiar, "Item Drop") * FarmingStrategy.itemDropValue()
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
    outfit.meat * FarmingStrategy.meatDropValue() +
    outfit.item * FarmingStrategy.itemDropValue();
  const expectedValue =
    f.expectedValue +
    (specialFamiliarOutfits.get(f.familiar)?.extraValue?.(outfit) ?? 0);
  const outfitWeight = outfit.weight;

  return {
    ...f,
    expectedValue,
    outfitValue,
    outfitWeight,
  };
}

function extraValue(
  target: MarginalFamiliar,
  meat: MarginalFamiliar,
  jellyfish: MarginalFamiliar | undefined,
) {
  const targetValue = totalFamiliarValue(target);
  const meatFamiliarValue = totalFamiliarValue(meat);
  const jelly = FarmingStrategy.monsters().every(
    (monster) => monster.attackElement === $element`Stench`,
  )
    ? $item`stench jelly`
    : Item.none;

  const jellyfishValue = jellyfish
    ? garboValue(jelly) / 20 +
      familiarAbilityValue(jellyfish.familiar) +
      jellyfish.outfitValue
    : 0;
  return Math.max(targetValue - Math.max(meatFamiliarValue, jellyfishValue), 0);
}

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

  const fullMenu = menu(FarmingStrategy.location, {
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

  const meatFamiliarEntry = fullMenu.find(
    ({ familiar, limit }) => familiar === meat && limit !== "cupid",
  );

  if (!meatFamiliarEntry) {
    throw new Error("Something went wrong when initializing familiars!");
  }

  const meatFamiliarValue = totalFamiliarValue(meatFamiliarEntry);
  // Ultimately, using our meat familiar all day is the default behavior
  // so any familiar worse than that isn't worth spending any time thinking about
  const viableMenu = fullMenu.filter(
    (f) => totalFamiliarValue(f) >= meatFamiliarValue,
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

  const cruisingFamiliarValue = totalFamiliarValue(cruisingFamiliar);

  // Only consider familiars better than our best unlimited familiar
  const finalMenu = viableMenu.filter(
    (f) => totalFamiliarValue(f) >= cruisingFamiliarValue,
  );

  // If the shrub beats our cruising familiar, use it
  const shrubAvailable = finalMenu.some(
    ({ familiar }) => familiar === $familiar`Crimbo Shrub`,
  );

  if (shrubAvailable) {
    return {
      familiar: $familiar`Crimbo Shrub`,
      extraValue: 0,
    };
  }

  const turnsNeeded = sum(
    finalMenu,
    turnsNeededFromBaseline(cruisingFamiliar, usedTcbFamiliars),
  );

  // If we have enough turns to get all the drops we need, prioritize by using our best leprechauns first
  // Otherwise, prioritize by using the most valuable familiar
  const best =
    turnsNeeded < turnsAvailable()
      ? maxBy(finalMenu, "leprechaunMultiplier")
      : maxBy(finalMenu, totalFamiliarValue);

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
        SkeletonOfCrimboPast.expectedBones(FarmingStrategy.location)
      );

    case $familiar`Sword of S Words`: {
      if (!get("swordOfSWordsMonster")) {
        return 0;
      } else {
        return clamp(100 - get("_swordOfSWordsKills"), 0, 100);
      }
    }

    default:
      return 0;
  }
}
