import {
  canEquip,
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
  sumNumbers,
  ToyCupidBow,
} from "libram";
import { NumericModifier } from "libram/dist/modifierTypes";
import { bonusGear } from "../outfit/dropsgear";
import { HIGHLIGHT, withLocation } from "../lib";
import { computeBarfOutfit } from "../outfit/barf";
import { estimatedGarboTurns } from "../turns";
import { getAllDrops } from "./dropFamiliars";
import { getExperienceFamiliarLimit } from "./experienceFamiliars";
import { getAllJellyfishDrops, menu } from "./menu";
import {
  amuletCoinOpportunityCost,
  bestFamiliarChoice,
  CupidBowAction,
  GeneralFamiliar,
  timeToMeatify,
  turnsAvailable,
} from "./lib";
import { meatFamiliar } from "./meatFamiliar";
import { FarmingStrategy } from "../farmingStrategy";
import { globalOptions } from "../config";
import {
  chooseCupidBow,
  CupidBowChoice,
  cupidBowResetCost,
  getCupidBowDrops,
  getToyCupidBowFamiliars,
  shortlistCupidBowFamiliars,
} from "./toyCupidBowFamiliar";
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
          "expectedTurns",
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

function cupidBowAvailable(
  familiar: Familiar,
  equipmentForced: boolean,
): boolean {
  return (
    !equipmentForced &&
    !familiarNeedsBoot(familiar) &&
    !specialFamiliarOutfits.get(familiar)?.equip &&
    canEquip(familiar, $item`toy Cupid bow`)
  );
}

function barfFamiliarCandidates(
  equipmentForced: boolean,
  fightsAvailable: number,
) {
  const ordinary = menu(FarmingStrategy.location, { mode: "barf" }).map(
    calculateOutfitValue,
  );
  const cupidBowDrops = getCupidBowDrops(fightsAvailable, (familiar) =>
    cupidBowAvailable(familiar, equipmentForced),
  );
  const cupidBowOnly = getToyCupidBowFamiliars(
    ordinary,
    cupidBowDrops,
    calculateOutfitValue,
  );
  const cruisingFamiliar = maxBy(
    ordinary.filter(({ limit }) => limit === "none"),
    totalFamiliarValue,
  );
  return { ordinary, cupidBowOnly, cupidBowDrops, cruisingFamiliar };
}

export function barfCupidBowResetCost(): number {
  const current = ToyCupidBow.currentFamiliar();
  if (
    !ToyCupidBow.have() ||
    !current ||
    ToyCupidBow.doneToday(current) ||
    globalOptions.nobarf ||
    get("garbo_IgnoreMarginalFamiliars", false)
  ) {
    return 0;
  }

  return withLocation(FarmingStrategy.location, () => {
    const fightsAvailable = turnsAvailable();
    const { ordinary, cupidBowOnly, cupidBowDrops, cruisingFamiliar } =
      barfFamiliarCandidates(false, fightsAvailable);
    return cupidBowResetCost(
      [...ordinary, ...cupidBowOnly],
      cupidBowDrops,
      fightsAvailable,
      (candidate) =>
        totalFamiliarValue(candidate) -
        amuletCoinOpportunityCost(candidate.familiar),
      totalFamiliarValue(cruisingFamiliar),
    );
  });
}

function totalFamiliarTurns(
  ordinary: MarginalFamiliar[],
  choices: CupidBowChoice<MarginalFamiliar>[],
  baseline: MarginalFamiliar,
): number {
  const turnsByFamiliar = new Map<Familiar, number>();
  const baselineValue = totalFamiliarValue(baseline);
  const turnsNeeded = turnsNeededFromBaseline(baseline);
  for (const candidate of ordinary) {
    if (totalFamiliarValue(candidate) < baselineValue) continue;
    turnsByFamiliar.set(
      candidate.familiar,
      Math.max(
        turnsByFamiliar.get(candidate.familiar) ?? 0,
        turnsNeeded(candidate),
      ),
    );
  }
  // The same fights advance both the bow and the familiar's ordinary benefit.
  for (const { familiar, cupidBowTurns } of choices) {
    turnsByFamiliar.set(
      familiar,
      Math.max(turnsByFamiliar.get(familiar) ?? 0, cupidBowTurns),
    );
  }
  return sumNumbers([...turnsByFamiliar.values()]);
}

function selectFamiliarWithCupidBowProgress(
  candidates: CupidBowChoice<MarginalFamiliar>[],
): CupidBowChoice<MarginalFamiliar> {
  const highestValue = bestFamiliarChoice(candidates, totalFamiliarValue);
  if (!highestValue.cupidBowTurns && highestValue.limit !== "none") {
    return highestValue;
  }

  const current = ToyCupidBow.currentFamiliar();
  const currentCupidBowChoices = candidates.filter(
    ({ familiar, cupidBowTurns }) => familiar === current && cupidBowTurns > 0,
  );
  if (currentCupidBowChoices.length) {
    return bestFamiliarChoice(currentCupidBowChoices, totalFamiliarValue);
  }
  return highestValue;
}

export function barfFamiliar(equipmentForced: boolean): {
  familiar: Familiar;
  extraValue: number;
  cupidBow: CupidBowAction;
} {
  if (timeToMeatify()) {
    return {
      familiar: $familiar`Grey Goose`,
      extraValue: 0,
      cupidBow: barfCupidBowResetCost() > 0 ? "avoid" : "allow",
    };
  }
  if (get("garbo_IgnoreMarginalFamiliars", false)) {
    return { familiar: meatFamiliar(), extraValue: 0, cupidBow: "allow" };
  }

  const fightsAvailable = turnsAvailable();
  const { ordinary, cupidBowOnly, cupidBowDrops, cruisingFamiliar } =
    barfFamiliarCandidates(equipmentForced, fightsAvailable);
  const currentCupidBowResetCost = cupidBowResetCost(
    [...ordinary, ...cupidBowOnly],
    cupidBowDrops,
    fightsAvailable,
    (candidate) =>
      totalFamiliarValue(candidate) -
      amuletCoinOpportunityCost(candidate.familiar),
    totalFamiliarValue(cruisingFamiliar),
  );
  const evaluate = (candidate: MarginalFamiliar) =>
    chooseCupidBow(candidate, cupidBowDrops, currentCupidBowResetCost, {
      equipmentAvailable: cupidBowAvailable(
        candidate.familiar,
        equipmentForced,
      ),
      extraValue: -amuletCoinOpportunityCost(candidate.familiar),
    });
  const profitable = (candidate: MarginalFamiliar) =>
    totalFamiliarValue(candidate) >= totalFamiliarValue(cruisingFamiliar);
  const ordinaryChoices = ordinary.map(evaluate).filter(profitable);
  const cupidBowOnlyChoices = cupidBowOnly
    .map(evaluate)
    .filter((choice) => choice.cupidBowTurns > 0 && profitable(choice));
  const totalTurnsNeeded = totalFamiliarTurns(
    ordinary,
    [...ordinaryChoices, ...cupidBowOnlyChoices],
    cruisingFamiliar,
  );
  const choices = [
    ...ordinaryChoices,
    ...shortlistCupidBowFamiliars(cupidBowOnlyChoices, totalFamiliarValue),
  ];

  const selectedFamiliar = (() => {
    const shrubChoices = choices.filter(
      ({ familiar }) => familiar === $familiar`Crimbo Shrub`,
    );
    if (shrubChoices.length) {
      return bestFamiliarChoice(shrubChoices, totalFamiliarValue);
    }

    if (totalTurnsNeeded < fightsAvailable) {
      const highestMultiplier = maxBy(
        choices,
        "leprechaunMultiplier",
      ).leprechaunMultiplier;
      return selectFamiliarWithCupidBowProgress(
        choices.filter(
          ({ leprechaunMultiplier }) =>
            leprechaunMultiplier === highestMultiplier,
        ),
      );
    }
    return bestFamiliarChoice(choices, totalFamiliarValue);
  })();

  const meatFamiliarEntry = ordinary.find(
    ({ familiar }) => familiar === meatFamiliar(),
  );
  if (!meatFamiliarEntry) {
    throw new Error("Something went wrong when initializing familiars!");
  }
  print(
    `Choosing to use ${selectedFamiliar.familiar} ${familiarPrintout(selectedFamiliar)} over ${meatFamiliarEntry.familiar} ${familiarPrintout(meatFamiliarEntry)}.`,
    HIGHLIGHT,
  );
  return {
    familiar: selectedFamiliar.familiar,
    extraValue: Math.max(
      totalFamiliarValue(selectedFamiliar) -
        totalFamiliarValue(meatFamiliarEntry),
      0,
    ),
    cupidBow: selectedFamiliar.cupidBow,
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
