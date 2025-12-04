import {
  equippedItem,
  Familiar,
  fullnessLimit,
  getWorkshed,
  haveEffect,
  Item,
  mallPrice,
  myFullness,
  myFury,
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
  clamp,
  DaylightShavings,
  DesignerSweatpants,
  get,
  getAverageAdventures,
  have,
  JuneCleaver,
  sum,
  sumNumbers,
  ToyCupidBow,
} from "libram";
import { globalOptions } from "../config";
import { cheapestItem } from "../diet";
import {
  baseMeat,
  bestJuneCleaverOption,
  BonusEquipMode,
  juneCleaverChoiceValues,
  modeUseLimitedDrops,
  modeValueOfMeat,
  targetPointerRingMeat,
  valueJuneCleaverOption,
} from "../lib";
import { garboAverageValue, garboValue } from "../garboValue";
import { estimatedGarboTurns, remainingUserTurns } from "../turns";
import { bonusAccessories } from "./dropsgearAccessories";
import {
  familiarEquipmentValue,
  getUsedTcbFamiliars,
  knuckleboneValue,
  tcbTurnsLeft,
} from "../familiar/lib";

const pantsgivingBonuses = new Map<number, number>();
function pantsgiving(mode: BonusEquipMode) {
  if (!have($item`Pantsgiving`) || !modeUseLimitedDrops(mode)) {
    return new Map<Item, number>();
  }
  const count = get("_pantsgivingCount");
  const turnArray = [5, 50, 500, 5000];
  const index =
    myFullness() === fullnessLimit()
      ? get("_pantsgivingFullness")
      : turnArray.findIndex((x) => count < x);
  const turns = turnArray[index] || 50000;

  if (turns - count > estimatedGarboTurns()) return new Map<Item, number>();

  const cachedBonus = pantsgivingBonuses.get(turns);
  if (cachedBonus) return new Map([[$item`Pantsgiving`, cachedBonus]]);

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
  const sinusVal = expectedUseableSinusTurns * 1.0 * baseMeat();
  const fullnessValue =
    sinusVal +
    get("valueOfAdventure") * 6.5 -
    (mallPrice($item`jumping horseradish`) +
      mallPrice($item`Special Seasoning`));
  const pantsgivingBonus = fullnessValue / (turns * 0.9);
  pantsgivingBonuses.set(turns, pantsgivingBonus);
  return new Map<Item, number>([[$item`Pantsgiving`, pantsgivingBonus]]);
}

function sweatpants(mode: BonusEquipMode) {
  if (
    !have($item`designer sweatpants`) ||
    mode === BonusEquipMode.MEAT_TARGET
  ) {
    return new Map();
  }

  const needSweat =
    (!globalOptions.ascend &&
      DesignerSweatpants.sweat() <
        DesignerSweatpants.sweatCost($skill`Sweat Out Some Booze`) * 3) ||
    DesignerSweatpants.sweat() <
      DesignerSweatpants.sweatCost($skill`Sweat Out Some Booze`) *
        DesignerSweatpants.potentialCasts($skill`Sweat Out Some Booze`);

  if (!needSweat) return new Map();

  const VOA = get("valueOfAdventure");

  const bestPerfectDrink = cheapestItem(
    $items`perfect cosmopolitan, perfect negroni, perfect dark and stormy, perfect mimosa, perfect old-fashioned, perfect paloma`,
  );
  const perfectDrinkValuePerDrunk =
    ((getAverageAdventures(bestPerfectDrink) + 3) * VOA -
      mallPrice(bestPerfectDrink)) /
    3;
  const splendidMartiniValuePerDrunk =
    (getAverageAdventures($item`splendid martini`) + 2) * VOA;

  const bonus =
    (Math.max(perfectDrinkValuePerDrunk, splendidMartiniValuePerDrunk) * 2) /
    25;
  return new Map([[$item`designer sweatpants`, bonus]]);
}

function pantogramPants() {
  if (
    !have($item`pantogram pants`) ||
    !get("_pantogramModifier").includes("Drops Items")
  ) {
    return new Map<Item, number>([]);
  }

  // TODO: Calculate actual bonus value (good luck!)
  return new Map<Item, number>([[$item`pantogram pants`, 100]]);
}

function bagOfManyConfections() {
  if (
    !have($item`bag of many confections`) ||
    !have($familiar`Stocking Mimic`)
  ) {
    return new Map<Item, number>([]);
  }

  return new Map<Item, number>([
    [
      $item`bag of many confections`,
      garboAverageValue(...$items`Polka Pop, BitterSweetTarts, Piddles`) / 6,
    ],
  ]);
}

function snowSuit(mode: BonusEquipMode) {
  // Ignore for MEAT_TARGET
  // Ignore for DMT, assuming mafia might get confused about the drop by the weird combats
  if (
    !have($item`Snow Suit`) ||
    get("_carrotNoseDrops") >= 3 ||
    !modeUseLimitedDrops(mode)
  ) {
    return new Map<Item, number>([]);
  }

  return new Map<Item, number>([
    [$item`Snow Suit`, garboValue($item`carrot nose`) / 10],
  ]);
}

function mayflowerBouquet(mode: BonusEquipMode) {
  // +40% meat drop 12.5% of the time (effectively 5%)
  // Drops flowers 50% of the time, wiki says 5-10 a day.
  // Theorized that flower drop rate drops off but no info on wiki.
  // During testing I got 4 drops then the 5th took like 40 more adventures
  // so let's just assume rate drops by 11% with a min of 1% ¯\_(ツ)_/¯

  // Ignore for MEAT_TARGET
  // Ignore for DMT, assuming mafia might get confused about the drop by the weird combats
  if (!have($item`Mayflower bouquet`) || !modeUseLimitedDrops(mode)) {
    return new Map<Item, number>([]);
  }

  const sporadicMeatBonus = (40 * 0.125 * modeValueOfMeat(mode)) / 100;
  const averageFlowerValue =
    garboAverageValue(
      ...$items`tin magnolia, upsy daisy, lesser grodulated violet, half-orchid, begpwnia`,
    ) * Math.max(0.01, 0.5 - get("_mayflowerDrops") * 0.11);
  return new Map<Item, number>([
    [
      $item`Mayflower bouquet`,
      (get("_mayflowerDrops") < 10 ? averageFlowerValue : 0) +
        sporadicMeatBonus,
    ],
  ]);
}

export function magnifyingGlass(): Map<Item, number> {
  if (
    !have($item`cursed magnifying glass`) ||
    get("_voidFreeFights") >= 5 ||
    get("cursedMagnifyingGlassCount") >= 13
  ) {
    return new Map<Item, number>();
  }

  return new Map<Item, number>([
    [$item`cursed magnifying glass`, globalOptions.prefs.valueOfFreeFight / 13],
  ]);
}

function bindlestocking(mode: BonusEquipMode): Map<Item, number> {
  // Requires a guaranteed critical hit that does not need the weapon or off-hand slots
  // Only BARF is supported as it is difficult to always crit elsewhere
  const canCrit =
    (have($skill`Furious Wallop`) && myFury() > 0) ||
    have($skill`Head in the Game`);
  if (
    !have($item`bindlestocking`) ||
    mode !== BonusEquipMode.BARF ||
    !canCrit
  ) {
    return new Map<Item, number>();
  }

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

  return new Map<Item, number>([[$item`bindlestocking`, value]]);
}

function simpleTargetCrits(mode: BonusEquipMode): Map<Item, number> {
  const canCrit =
    (have($skill`Furious Wallop`) && myFury() > 0) ||
    have($skill`Head in the Game`);
  if (
    !have($item`mafia pointer finger ring`) ||
    mode !== BonusEquipMode.MEAT_TARGET ||
    !canCrit ||
    globalOptions.target.attributes.includes("FREE")
  ) {
    return new Map<Item, number>();
  }
  return new Map<Item, number>([
    [$item`mafia pointer finger ring`, targetPointerRingMeat()],
  ]);
}

function batWings(mode: BonusEquipMode): Map<Item, number> {
  const batWings = $item`bat wings`;
  if (
    !BatWings.have() ||
    mode !== BonusEquipMode.BARF ||
    BatWings.flapChance() === 0
  ) {
    return new Map<Item, number>();
  }
  const value = BatWings.flapChance() * get("valueOfAdventure");
  return new Map<Item, number>([[batWings, value]]);
}

export function bonusGear(
  mode: BonusEquipMode,
  valueCircumstantialBonus = true,
): Map<Item, number> {
  return new Map<Item, number>([
    ...bonusAccessories(mode),
    ...pantogramPants(),
    ...bagOfManyConfections(),
    ...stickers(mode),
    ...powerGlove(),
    ...sneegleebs(),
    ...bindlestocking(mode),
    ...simpleTargetCrits(mode),
    ...batWings(mode),
    ...mobius(mode),
    ...(valueCircumstantialBonus
      ? new Map<Item, number>([
          ...pantsgiving(mode),
          ...sweatpants(mode),
          ...shavingBonus(),
          ...snowSuit(mode),
          ...mayflowerBouquet(mode),
          ...(mode === BonusEquipMode.BARF ? magnifyingGlass() : []),
          ...juneCleaver(mode),
          ...rakeLeaves(mode),
          ...aviatorGoggles(mode),
          ...skeletonCane(mode),
        ])
      : []),
  ]);
}

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

function mobius(mode: BonusEquipMode): Map<Item, number> {
  if (mode === BonusEquipMode.BARF) {
    const value =
      totalTurnsPlayed() - get("_lastMobiusStripTurn", 0) >
      encounterMap[get("_mobiusStripEncounters", 0)] - 3
        ? Math.max(mallPrice($item`clock`), get("valueOfAdventure") * 3) / 2
        : 0;
    return new Map<Item, number>([[$item`Möbius ring`, value]]);
  }
  return new Map();
}

function shavingBonus(): Map<Item, number> {
  if (
    !DaylightShavings.have() ||
    DaylightShavings.buffs.some((buff) => have(buff, 2))
  ) {
    return new Map();
  }

  const timeToMeatBuff =
    11 * (DaylightShavings.buffsUntil($effect`Friendly Chops`) ?? Infinity);
  if (globalOptions.ascend && timeToMeatBuff > estimatedGarboTurns()) {
    return new Map();
  }

  if (
    !globalOptions.ascend &&
    DaylightShavings.nextBuff() === $effect`Friendly Chops` &&
    estimatedGarboTurns() < 11 * 11
  ) {
    return new Map();
  }

  const bonusValue = (baseMeat() * 100 + 72 * 50) / 100;
  return new Map<Item, number>([[$item`Daylight Shavings Helmet`, bonusValue]]);
}

let juneCleaverEV: number | null = null;
function juneCleaver(mode: BonusEquipMode): Map<Item, number> {
  const estimatedJuneCleaverTurns =
    remainingUserTurns() + estimatedGarboTurns();
  if (
    !have($item`June cleaver`) ||
    get("_juneCleaverFightsLeft") > estimatedJuneCleaverTurns ||
    !get("_juneCleaverFightsLeft")
  ) {
    return new Map();
  }
  if (!juneCleaverEV) {
    juneCleaverEV =
      sum([...JuneCleaver.choices], (choice) =>
        valueJuneCleaverOption(
          juneCleaverChoiceValues[choice][bestJuneCleaverOption(choice)],
        ),
      ) / JuneCleaver.choices.length;
  }
  // If we're ascending then the chances of hitting choices in the queue is reduced
  if (
    globalOptions.ascend &&
    estimatedJuneCleaverTurns <= 180 &&
    JuneCleaver.getInterval() === 30
  ) {
    const availEV =
      sum([...JuneCleaver.choicesAvailable()], (choice) =>
        valueJuneCleaverOption(
          juneCleaverChoiceValues[choice][bestJuneCleaverOption(choice)],
        ),
      ) / JuneCleaver.choicesAvailable().length;
    const queueEV =
      sum([...JuneCleaver.queue()], (choice) => {
        const choiceValue = valueJuneCleaverOption(
          juneCleaverChoiceValues[choice][bestJuneCleaverOption(choice)],
        );
        const cleaverEncountersLeft = Math.floor(
          estimatedJuneCleaverTurns / 30,
        );
        const encountersToQueueExit = 1 + JuneCleaver.queue().indexOf(choice);
        const chancesLeft = Math.max(
          0,
          cleaverEncountersLeft - encountersToQueueExit,
        );
        const encounterProbability = 1 - Math.pow(2 / 3, chancesLeft);
        return choiceValue * encounterProbability;
      }) / JuneCleaver.queue().length;
    juneCleaverEV = queueEV + availEV;
  }

  const interval =
    mode === BonusEquipMode.MEAT_TARGET ? 30 : JuneCleaver.getInterval();
  return new Map<Item, number>([
    [$item`June cleaver`, juneCleaverEV / interval],
  ]);
}

function rakeLeaves(mode: BonusEquipMode): Map<Item, number> {
  if (mode === BonusEquipMode.MEAT_TARGET || !BurningLeaves.have()) {
    return new Map();
  }
  const rakeValue = garboValue($item`inflammable leaf`) * 1.5;
  return new Map<Item, number>([
    [$item`rake`, rakeValue],
    [$item`tiny rake`, rakeValue],
  ]);
}

function aviatorGoggles(mode: BonusEquipMode): Map<Item, number> {
  if (mode === BonusEquipMode.MEAT_TARGET || !have($familiar`Mini Kiwi`)) {
    return new Map();
  }
  const goggleValue = garboValue($item`mini kiwi`) * 0.25;
  return new Map<Item, number>([[$item`aviator goggles`, goggleValue]]);
}

function skeletonCane(mode: BonusEquipMode): Map<Item, number> {
  if (
    mode === BonusEquipMode.MEAT_TARGET ||
    !have($familiar`Skeleton of Crimbo Past`)
  ) {
    return new Map();
  }
  // Cane improves drop rate by ~9.5%
  const caneValue = knuckleboneValue() * 0.1;
  return new Map<Item, number>([
    [$item`small peppermint-flavored sugar walking crook`, caneValue],
  ]);
}

function stickers(mode: BonusEquipMode): Map<Item, number> {
  // This function represents the _cost_ of using stickers
  // Embezzlers are the best monster to use them on, so there's functionally no cost
  if (mode === BonusEquipMode.MEAT_TARGET) return new Map();

  const cost = sumNumbers(
    $slots`sticker1, sticker2, sticker3`.map(
      (s) => mallPrice(equippedItem(s)) / 20,
    ),
  );
  return new Map([
    [$item`scratch 'n' sniff sword`, -1 * cost],
    [$item`scratch 'n' sniff crossbow`, -1 * cost],
  ]);
}

function powerGlove(): Map<Item, number> {
  if (!have($item`Powerful Glove`)) return new Map();
  // 23% proc rate, according to the wiki
  // https://kol.coldfront.net/thekolwiki/index.php/Powerful_Glove
  return new Map([
    [
      $item`Powerful Glove`,
      0.25 *
        garboAverageValue(
          ...$items`blue pixel, green pixel, red pixel, white pixel`,
        ),
    ],
  ]);
}

const POSSIBLE_SNEEGLEEB_DROPS = Item.all().filter(
  (i) =>
    i.tradeable && i.discardable && (i.inebriety || i.fullness || i.potion),
);
let sneegleebBonus: number;
const SNEEGLEEB_DROP_RATE = 0.13;
const MAX_SNEEGLEEB_PRICE = 100_000; // arbitrary, to help avoid outliers
function sneegleebs(): Map<Item, number> {
  sneegleebBonus ??=
    (sum(POSSIBLE_SNEEGLEEB_DROPS, (item) =>
      Math.min(garboValue(item), MAX_SNEEGLEEB_PRICE),
    ) /
      POSSIBLE_SNEEGLEEB_DROPS.length) *
    SNEEGLEEB_DROP_RATE;
  return new Map<Item, number>(
    (
      [
        [$item`KoL Con 13 snowglobe`, sneegleebBonus],
        [$item`can of mixed everything`, sneegleebBonus / 2],
      ] as const
    ).filter(([item]) => have(item)),
  );
}

export function toyCupidBow(familiar: Familiar): Map<Item, number> {
  if (!ToyCupidBow.have()) return new Map();
  const turns = tcbTurnsLeft(familiar, getUsedTcbFamiliars());
  if (estimatedGarboTurns() <= turns) {
    return new Map();
  }
  return new Map([
    [$item`toy Cupid bow`, familiarEquipmentValue(familiar) / turns],
  ]);
}
