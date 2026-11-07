import type { Outfit } from "grimoire-kolmafia";
import {
  equippedItem,
  fullnessLimit,
  getWorkshed,
  haveEffect,
  Item,
  itemAmount,
  mallPrice,
  Modifier,
  myFullness,
  myFury,
  stringModifier,
  totalTurnsPlayed,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $items,
  $skill,
  $slots,
  BatWings,
  BurningLeaves,
  CinchoDeMayo,
  clamp,
  DaylightShavings,
  DesignerSweatpants,
  get,
  getAverageAdventures,
  have,
  JuneCleaver,
  LaughingStock,
  lgrCurrencies,
  sum,
  sumNumbers,
  ToyCupidBow,
} from "libram";
import { globalOptions } from "../config";
import { cheapestItem } from "../diet";
import {
  bestJuneCleaverOption,
  felizValue,
  juneCleaverChoiceValues,
  maxPassiveDamage,
  monsterManuelAvailable,
  targetPointerRingMeat,
  valueJuneCleaverOption,
} from "../lib";
import {
  garboAverageValue,
  garboKnuckleboneValue,
  garboValue,
} from "../garboValue";
import { estimatedGarboTurns, remainingUserTurns } from "../turns";
import { getCupidBowValues } from "../familiar/toyCupidBowValue";
import { AdventureArgument } from "../garboWanderer";
import { FarmingStrategy } from "../farmingStrategy";
import { maximumPinataCasts } from "../resources/yachtzee";
import {
  BonusEquipMode,
  BonusGear,
  BonusGearSelection,
  bonusGearValues,
  FREE_MODES,
  LIMITED_DROP_MODES,
  modeValueOfMeat,
} from "./lib";

const mafiaThumbRing = new BonusGear($item`mafia thumb ring`, {
  modes: [BonusEquipMode.MEAT_TARGET, BonusEquipMode.BARF],
  value: () => (1 / 0.96 - 1) * get("valueOfAdventure"),
});

export function luckyGoldRingDropValues(
  includeVolcoino: boolean,
  includeFreddy: boolean,
): number[] {
  // Volcoino has a low drop rate which isn't accounted for here
  // Overestimating until it drops is probably fine, don't @ me
  const dropValues = [
    100, // 80 - 120 meat
    ...[
      itemAmount($item`hobo nickel`) > 0 ? 100 : 0, // This should be closeted
      itemAmount($item`sand dollar`) > 0 ? garboValue($item`sand dollar`) : 0, // This should be closeted
      includeFreddy ? garboValue($item`Freddy Kruegerand`) : 0,
      ...lgrCurrencies().map((i) => {
        if (i === $item`Volcoino` && !includeVolcoino) return 0;

        // Libram only includes the 0.
        if (i === $item`0`) return garboAverageValue(...$items`0, 1`);
        return garboValue(i);
      }),
    ].filter((value) => value > 0),
  ];

  return dropValues;
}

const luckyGoldRing = new BonusGear($item`lucky gold ring`, {
  modes: [...LIMITED_DROP_MODES, BonusEquipMode.MEAT_TARGET],
  value: (mode) => {
    const dropValues = luckyGoldRingDropValues(
      !(mode === BonusEquipMode.MEAT_TARGET && !globalOptions.nobarf), // Save the two daily Volcoinos for lower-Meat fights unless nobarf
      itemAmount($item`Freddy Kruegerand`) > 0,
    );

    // Items drop every ~10 turns
    return sumNumbers(dropValues) / dropValues.length / 10;
  },
});

function calculateMrCheengsSpectaclesBonus() {
  // Eligible potions are PvP-stealable and not banned by a future Standard season.
  const lastAvailableModifier = Modifier.get("Last Available");
  const possibleDrops = Item.all().filter(
    (i) =>
      i.tradeable &&
      i.discardable &&
      i.potion &&
      stringModifier(i, lastAvailableModifier) === "",
  );
  const dropRate = 0.25; // Items drop every 4 turns
  const maxPrice = 100_000; // arbitrary, to help avoid outliers
  return (
    (sum(possibleDrops, (item) => Math.min(garboValue(item), maxPrice)) /
      possibleDrops.length) *
    dropRate
  );
}

let mrCheengsBonus: number;
const mrCheengsSpectacles = new BonusGear($item`Mr. Cheeng's spectacles`, {
  value: () => (mrCheengsBonus ??= calculateMrCheengsSpectaclesBonus()),
});

const mrScreegesSpectacles = new BonusGear($item`Mr. Screege's spectacles`, {
  value: 180,
});

const cinchoDeMayo = new BonusGear($item`Cincho de Mayo`, {
  outcomes: ["win", "run"],
  modes: LIMITED_DROP_MODES,
  available: () =>
    CinchoDeMayo.currentCinch() !== 0 &&
    // Manuel and passive damage estimates keep stasis from killing the monster.
    monsterManuelAvailable() &&
    // Reserve cinch for Yachtzees, when applicable.
    maximumPinataCasts() > 0 &&
    maxPassiveDamage() < (FarmingStrategy.isUnderwater() ? 150 : 50),
  value: () => {
    // One Projectile Pinata yields three Robortender candies before combat ends.
    return 3 * felizValue();
  },
});

function calculateLaughingStockBonus(alwaysUseHorizon: boolean) {
  const basicFruitValue = garboAverageValue(
    ...$items`orange, grapefruit, grapes, lemon, lime, papaya, cranberries, strawberry, cherry, kumquat, tangerine, raspberry, kiwi, blackberry, banana, cactus fruit, plum, pear, peach`,
  );
  const classicFruitValue = garboAverageValue(
    ...$items`classic banana, antique watermelon, quince`,
  );

  const horizonValue = 0.02 * (0.1 * classicFruitValue + 0.9 * basicFruitValue);

  if (alwaysUseHorizon) return horizonValue;

  const nextDrop = LaughingStock.nextDrop();

  if (nextDrop) {
    const [fruit, fights] = nextDrop;
    if (fights > estimatedGarboTurns()) return 0;
    return Math.max(garboValue(fruit) / fights, horizonValue);
  }

  return horizonValue;
}

const portableLaughingStock = new BonusGear($item`Portable Laughing Stock`, {
  modes: [...LIMITED_DROP_MODES, BonusEquipMode.MEAT_TARGET],
  value: (mode) =>
    calculateLaughingStockBonus(mode !== BonusEquipMode.MEAT_TARGET),
});

const pantsgivingBonuses = new Map<number, number>();
const pantsgiving = new BonusGear($item`Pantsgiving`, {
  outcomes: ["win", "run"],
  circumstantial: true,
  modes: LIMITED_DROP_MODES,
  value: () => {
    const count = get("_pantsgivingCount");
    const turnArray = [5, 50, 500, 5000];
    const index =
      myFullness() === fullnessLimit()
        ? get("_pantsgivingFullness")
        : turnArray.findIndex((x) => count < x);
    const turns = turnArray[index] || 50000;

    if (turns - count > estimatedGarboTurns()) return null;

    const cachedBonus = pantsgivingBonuses.get(turns);
    if (cachedBonus) return cachedBonus;

    const expectedSinusTurns =
      getWorkshed() === $item`portable Mayo Clinic` ? 100 : 50;
    const expectedUseableSinusTurns = globalOptions.ascend
      ? clamp(
          estimatedGarboTurns() -
            (turns - count) -
            haveEffect($effect`Kicked in the Sinuses`),
          0,
          expectedSinusTurns,
        )
      : expectedSinusTurns;
    const sinusValue =
      expectedUseableSinusTurns * 1.0 * FarmingStrategy.baseMeat();
    const fullnessValue =
      sinusValue +
      get("valueOfAdventure") * 6.5 -
      (mallPrice($item`jumping horseradish`) +
        mallPrice($item`Special Seasoning`));
    const pantsgivingBonus = fullnessValue / (turns * 0.9);
    pantsgivingBonuses.set(turns, pantsgivingBonus);
    return pantsgivingBonus;
  },
});

const sweatpants = new BonusGear($item`designer sweatpants`, {
  outcomes: ["win", "run"],
  circumstantial: true,
  modes: [...FREE_MODES, BonusEquipMode.BARF],
  value: () => {
    const needSweat =
      (!globalOptions.ascend &&
        DesignerSweatpants.sweat() <
          DesignerSweatpants.sweatCost($skill`Sweat Out Some Booze`) * 3) ||
      DesignerSweatpants.sweat() <
        DesignerSweatpants.sweatCost($skill`Sweat Out Some Booze`) *
          DesignerSweatpants.potentialCasts($skill`Sweat Out Some Booze`);

    if (!needSweat) return null;

    const valueOfAdventure = get("valueOfAdventure");

    const cheapestPerfectDrink = cheapestItem(
      $items`perfect cosmopolitan, perfect negroni, perfect dark and stormy, perfect mimosa, perfect old-fashioned, perfect paloma`,
    );
    const perfectDrinkValuePerDrunk =
      ((getAverageAdventures(cheapestPerfectDrink) + 3) * valueOfAdventure -
        mallPrice(cheapestPerfectDrink)) /
      3;
    const splendidMartiniValuePerDrunk =
      (getAverageAdventures($item`splendid martini`) + 2) * valueOfAdventure;

    const bonus =
      (Math.max(perfectDrinkValuePerDrunk, splendidMartiniValuePerDrunk) * 2) /
      25;
    return bonus;
  },
});

const pantogramPants = new BonusGear($item`pantogram pants`, {
  available: () => get("_pantogramModifier").includes("Drops Items"),
  // TODO: Calculate the actual expected drop value.
  value: 100,
});

const bagOfManyConfections = new BonusGear($item`bag of many confections`, {
  available: () => have($familiar`Stocking Mimic`),
  value: () =>
    garboAverageValue(...$items`Polka Pop, BitterSweetTarts, Piddles`) / 6,
});

const snowSuit = new BonusGear($item`Snow Suit`, {
  circumstantial: true,
  modes: LIMITED_DROP_MODES,
  available: () => get("_carrotNoseDrops") < 3,
  value: () => garboValue($item`carrot nose`) / 10,
});

const mayflowerBouquet = new BonusGear($item`Mayflower bouquet`, {
  circumstantial: true,
  modes: LIMITED_DROP_MODES,
  value: (mode) => {
    // +40% meat drop 12.5% of the time (effectively 5%)
    // Drops flowers 50% of the time, wiki says 5-10 a day.
    // Theorized that flower drop rate drops off but no info on wiki.
    // During testing I got 4 drops then the 5th took like 40 more adventures
    // so let's just assume rate drops by 11% with a min of 1% ¯\_(ツ)_/¯

    const sporadicMeatBonus = (40 * 0.125 * modeValueOfMeat(mode)) / 100;
    const averageFlowerValue =
      garboAverageValue(
        ...$items`tin magnolia, upsy daisy, lesser grodulated violet, half-orchid, begpwnia`,
      ) * Math.max(0.01, 0.5 - get("_mayflowerDrops") * 0.11);
    return (
      (get("_mayflowerDrops") < 10 ? averageFlowerValue : 0) + sporadicMeatBonus
    );
  },
});

export const magnifyingGlass = new BonusGear($item`cursed magnifying glass`, {
  circumstantial: true,
  available: () =>
    get("_voidFreeFights") < 5 && get("cursedMagnifyingGlassCount") < 13,
  value: () => globalOptions.prefs.valueOfFreeFight / 13,
});

const bindlestocking = new BonusGear($item`bindlestocking`, {
  outcomes: ["win", "run"],
  modes: [BonusEquipMode.BARF],
  available: () =>
    // A guaranteed critical hit must leave the weapon and off-hand slots free.
    (have($skill`Furious Wallop`) && myFury() > 0) ||
    have($skill`Head in the Game`),
  value: () => {
    // TODO: Confirm drop rates with excavator https://excavator.loathers.net/projects/bindlestocking
    // The only valuable items are fancy chocolate or jawbruiser which probably appear ~1% of the time
    const value =
      0.49 *
        garboAverageValue(
          ...$items`Angry Farmer candy, Cold Hots candy, Daffy Taffy, Mr. Mediocrebar, Senior Mints, Wint-O-Fresh mint, orange`,
        ) +
      0.15 * garboAverageValue(...$items`eggnog, fruitcake, yo-yo`) +
      0.2 *
        garboAverageValue(
          ...$items`candy cane, ball, fancy dress ball, gingerbread bugbear, razor-tipped yo-yo`,
        ) +
      0.15 *
        garboAverageValue(
          ...$items`buckyball, gyroscope, monomolecular yo-yo, possessed top, top`,
        ) +
      0.01 * garboAverageValue(...$items`fancy chocolate, jawbruiser`);

    return value;
  },
});

const simpleTargetCrits = new BonusGear($item`mafia pointer finger ring`, {
  modes: [BonusEquipMode.MEAT_TARGET],
  available: () =>
    ((have($skill`Furious Wallop`) && myFury() > 0) ||
      have($skill`Head in the Game`)) &&
    !globalOptions.target.attributes.includes("FREE"),
  value: () => targetPointerRingMeat(),
});

const batWings = new BonusGear($item`bat wings`, {
  modes: [BonusEquipMode.BARF],
  available: () => BatWings.flapChance() !== 0,
  value: () => BatWings.flapChance() * get("valueOfAdventure"),
});

const encounterMap = [
  4, // 0
  7, // 1
  14, // 2
  14, // 3
  25, // 4
  25, // 5
  41, // 6
  41, // 7
  41, // 8
  41, // 9
  41, // 10
  51, // 11
  51, // 12
  51, // 13
  51, // 14
  51, // 15
  51, // 16
  51, // 17
  51, // 18
];

const mobius = new BonusGear($item`Möbius ring`, {
  outcomes: ["win", "run"],
  // Its cooldown advances unequipped; the current bonus prices a short visit,
  // and the later cooldowns are not fully known for a long-term average.
  circumstantial: true,
  requireOwned: false,
  modes: [BonusEquipMode.BARF],
  value: () =>
    totalTurnsPlayed() - get("_lastMobiusStripTurn", 0) >
    encounterMap[get("_mobiusStripEncounters", 0)] - 3
      ? Math.max(mallPrice($item`clock`), get("valueOfAdventure") * 3) / 2
      : 0,
});

const shavingBonus = new BonusGear($item`Daylight Shavings Helmet`, {
  circumstantial: true,
  available: () => !DaylightShavings.buffs.some((buff) => have(buff, 2)),
  value: () => {
    const timeToMeatBuff =
      11 * (DaylightShavings.buffsUntil($effect`Friendly Chops`) ?? Infinity);
    if (globalOptions.ascend && timeToMeatBuff > estimatedGarboTurns()) {
      return null;
    }

    if (
      !globalOptions.ascend &&
      DaylightShavings.nextBuff() === $effect`Friendly Chops` &&
      estimatedGarboTurns() < 11 * 11
    ) {
      return null;
    }

    const bonusValue = (FarmingStrategy.baseMeat() * 100 + 72 * 50) / 100;
    return bonusValue;
  },
});

let juneCleaverEV: number | null = null;
const juneCleaver = new BonusGear($item`June cleaver`, {
  outcomes: ["win", "run"],
  circumstantial: true,
  value: (mode) => {
    const estimatedJuneCleaverTurns =
      remainingUserTurns() + estimatedGarboTurns();
    const fightsLeft = get("_juneCleaverFightsLeft");
    if (fightsLeft > estimatedJuneCleaverTurns || !fightsLeft) {
      return null;
    }
    const valueChoice = (choice: (typeof JuneCleaver.choices)[number]) =>
      valueJuneCleaverOption(
        juneCleaverChoiceValues[choice][bestJuneCleaverOption(choice)],
      );
    juneCleaverEV ??=
      sum([...JuneCleaver.choices], valueChoice) / JuneCleaver.choices.length;
    let expectedValue = juneCleaverEV;

    if (
      globalOptions.ascend &&
      estimatedJuneCleaverTurns <= 180 &&
      JuneCleaver.getInterval() === 30
    ) {
      const cleaverEncountersLeft =
        1 + Math.floor((estimatedJuneCleaverTurns - fightsLeft) / 30);
      const totalChoiceValue = juneCleaverEV * JuneCleaver.choices.length; // un-average it

      const queueValues = JuneCleaver.queue().map(valueChoice);
      const encounterValues: number[] = [];

      for (let i = 0; i < cleaverEncountersLeft; i++) {
        const valueOfAvailableChoices =
          totalChoiceValue - sumNumbers(queueValues);
        const totalAvailableChoices =
          JuneCleaver.choices.length - queueValues.length;

        const nextValue = valueOfAvailableChoices / totalAvailableChoices;

        encounterValues.push(nextValue);
        queueValues.push(nextValue);
        if (queueValues.length > 6) queueValues.shift();
      }
      expectedValue = sumNumbers(encounterValues) / cleaverEncountersLeft;
    }

    const interval =
      mode === BonusEquipMode.MEAT_TARGET ? 30 : JuneCleaver.getInterval();
    return expectedValue / interval;
  },
});

const rakes = $items`rake, tiny rake`.map(
  (item) =>
    new BonusGear(item, {
      outcomes: ["win", "run"],
      circumstantial: true,
      requireOwned: false,
      modes: [...FREE_MODES, BonusEquipMode.BARF],
      available: () => BurningLeaves.have(),
      value: () => garboValue($item`inflammable leaf`) * 1.5,
    }),
);

const aviatorGoggles = new BonusGear($item`aviator goggles`, {
  circumstantial: true,
  requireOwned: false,
  modes: [...FREE_MODES, BonusEquipMode.BARF],
  available: () => have($familiar`Mini Kiwi`),
  value: () => garboValue($item`mini kiwi`) * 0.25,
});

const skeletonCane = new BonusGear(
  $item`small peppermint-flavored sugar walking crook`,
  {
    circumstantial: true,
    requireOwned: false,
    modes: [...FREE_MODES, BonusEquipMode.BARF],
    available: () =>
      have($familiar`Skeleton of Crimbo Past`) &&
      get("_knuckleboneDrops") < 100,
    value: () => garboKnuckleboneValue() * 0.1,
  },
);

const stickerWeapons =
  $items`scratch 'n' sniff sword, scratch 'n' sniff crossbow`.map(
    (item) =>
      new BonusGear(item, {
        outcomes: ["win", "run"],
        requireOwned: false,
        modes: [...FREE_MODES, BonusEquipMode.BARF],
        value: () => {
          // Charge sticker consumption outside meat targets, where they are most valuable.
          return -sum(
            $slots`sticker1, sticker2, sticker3`,
            (slot) => mallPrice(equippedItem(slot)) / 20,
          );
        },
      }),
  );

const powerGlove = new BonusGear($item`Powerful Glove`, {
  value: () =>
    0.25 *
    garboAverageValue(
      ...$items`blue pixel, green pixel, red pixel, white pixel`,
    ),
});

const speakeasyBanList = $items`glass of "milk", cup of "tea", thermos of "whiskey", Lucky Lindy, Bee's Knees, Sockdollager, Ish Kabibble, Hot Socks, Phonus Balonus, Flivver, Sloppy Jalopy`;

const POSSIBLE_SNEEGLEEB_DROPS = Item.all().filter(
  (i) =>
    i.tradeable &&
    i.discardable &&
    (i.inebriety ||
      i.fullness ||
      (i.potion && stringModifier(i, Modifier.get("Last Available")) === "")) &&
    !speakeasyBanList.includes(i),
);
let sneegleebBonus: number;
const SNEEGLEEB_DROP_RATE = 0.13;
const MAX_SNEEGLEEB_PRICE = 100_000; // arbitrary, to help avoid outliers
const sneegleebs = $items`KoL Con 13 snowglobe, can of mixed everything`.map(
  (item) =>
    new BonusGear(item, {
      value: () => {
        sneegleebBonus ??=
          (sum(POSSIBLE_SNEEGLEEB_DROPS, (item) =>
            Math.min(garboValue(item), MAX_SNEEGLEEB_PRICE),
          ) /
            POSSIBLE_SNEEGLEEB_DROPS.length) *
          SNEEGLEEB_DROP_RATE;
        return item === $item`KoL Con 13 snowglobe`
          ? sneegleebBonus
          : sneegleebBonus / 2;
      },
    }),
);

export function toyCupidBow(
  outfit: Outfit,
  adventure: AdventureArgument = FarmingStrategy.location,
): Map<Item, number> {
  const { familiar } = outfit;
  if (!familiar || !ToyCupidBow.have()) return new Map();
  // After the drop, only the bow's familiar experience can justify wearing it.
  if (
    ToyCupidBow.doneToday(familiar) &&
    (!outfit.modifier.some((modifier) =>
      /familiar exp|famexp/i.test(modifier),
    ) ||
      ToyCupidBow.turnsLeft() >= 5)
  ) {
    return new Map();
  }
  const cupidBowValue = getCupidBowValues(adventure).get(familiar);
  return cupidBowValue === undefined
    ? new Map()
    : new Map([[$item`toy Cupid bow`, cupidBowValue]]);
}

const CUP_OF_THIRTEENS_DROPS = POSSIBLE_SNEEGLEEB_DROPS.filter(
  (item) => item.inebriety,
);

let cupOfThirteensBonus: [string, number] | undefined;

const cupOfThirteens = new BonusGear($item`Cup of 13s`, {
  modes: LIMITED_DROP_MODES,
  value: () => {
    const dropsToday = get("_cupOf13sDrops");

    // A drop occurs at 6 charges if we haven't gotten a drop today.
    // Otherwise, the next drop occurs at 10 charges.
    const chargeRequired = dropsToday === 0 ? 6 : 10;

    const qualities =
      dropsToday <= 1
        ? ["EPIC", "awesome"]
        : dropsToday <= 3
          ? ["awesome", "good"]
          : dropsToday <= 5
            ? ["good", "decent"]
            : ["decent", "crappy"];

    if (cupOfThirteensBonus?.[0] !== qualities[0]) {
      const possibleDrops = CUP_OF_THIRTEENS_DROPS.filter((item) =>
        qualities.includes(item.quality),
      );
      cupOfThirteensBonus = [qualities[0], garboAverageValue(...possibleDrops)];
    }

    return cupOfThirteensBonus[1] / chargeRequired;
  },
});

const BONUS_GEAR: readonly BonusGear[] = [
  mafiaThumbRing,
  luckyGoldRing,
  mrCheengsSpectacles,
  portableLaughingStock,
  mrScreegesSpectacles,
  cinchoDeMayo,
  pantogramPants,
  bagOfManyConfections,
  ...stickerWeapons,
  powerGlove,
  ...sneegleebs,
  bindlestocking,
  simpleTargetCrits,
  batWings,
  cupOfThirteens,
  mobius,
  pantsgiving,
  sweatpants,
  shavingBonus,
  snowSuit,
  mayflowerBouquet,
  magnifyingGlass,
  juneCleaver,
  ...rakes,
  aviatorGoggles,
  skeletonCane,
];

export function bonusGear(
  mode: BonusEquipMode,
  options: BonusGearSelection = {},
): Map<Item, number> {
  // Ordinary free fights do not charge the glass. Pygmies use its instance
  // directly because bowls of scorpions are an exception.
  const gear = BONUS_GEAR.filter(
    (bonusGear) =>
      bonusGear !== magnifyingGlass || mode === BonusEquipMode.BARF,
  );
  return bonusGearValues(gear, mode, options);
}
