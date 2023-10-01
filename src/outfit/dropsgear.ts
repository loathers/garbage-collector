import {
  equippedItem,
  fullnessLimit,
  getWorkshed,
  haveEffect,
  Item,
  mallPrice,
  myFullness,
  numericModifier,
  toSlot,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $items,
  $slot,
  $slots,
  clamp,
  DaylightShavings,
  get,
  getAverageAdventures,
  getFoldGroup,
  have,
  JuneCleaver,
  sum,
  sumNumbers,
} from "libram";
import { globalOptions } from "../config";
import { mallMin } from "../diet";
import {
  baseMeat,
  bestJuneCleaverOption,
  BonusEquipMode,
  juneCleaverChoiceValues,
  modeUseLimitedDrops,
  modeValueOfMeat,
  valueJuneCleaverOption,
} from "../lib";
import { garboAverageValue, garboValue } from "../garboValue";
import { estimatedGarboTurns, remainingUserTurns } from "../turns";
import { bonusAccessories } from "./dropsgearAccessories";

const pantsgivingBonuses = new Map<number, number>();
function pantsgiving(mode: BonusEquipMode) {
  if (!have($item`Pantsgiving`) || !modeUseLimitedDrops(mode)) return new Map<Item, number>();
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

  const expectedSinusTurns = getWorkshed() === $item`portable Mayo Clinic` ? 100 : 50;
  const expectedUseableSinusTurns = globalOptions.ascend
    ? clamp(
        estimatedGarboTurns() - (turns - count) - haveEffect($effect`Kicked in the Sinuses`),
        0,
        expectedSinusTurns,
      )
    : expectedSinusTurns;
  const sinusVal = expectedUseableSinusTurns * 1.0 * baseMeat;
  const fullnessValue =
    sinusVal +
    get("valueOfAdventure") * 6.5 -
    (mallPrice($item`jumping horseradish`) + mallPrice($item`Special Seasoning`));
  const pantsgivingBonus = fullnessValue / (turns * 0.9);
  pantsgivingBonuses.set(turns, pantsgivingBonus);
  return new Map<Item, number>([[$item`Pantsgiving`, pantsgivingBonus]]);
}

function sweatpants(mode: BonusEquipMode) {
  if (!have($item`designer sweatpants`) || mode === BonusEquipMode.EMBEZZLER) return new Map();

  const needSweat =
    (!globalOptions.ascend && get("sweat") < 75) ||
    get("sweat") < 25 * (3 - get("_sweatOutSomeBoozeUsed"));

  if (!needSweat) return new Map();

  const VOA = get("valueOfAdventure");

  const bestPerfectDrink = mallMin(
    $items`perfect cosmopolitan, perfect negroni, perfect dark and stormy, perfect mimosa, perfect old-fashioned, perfect paloma`,
  );
  const perfectDrinkValuePerDrunk =
    ((getAverageAdventures(bestPerfectDrink) + 3) * VOA - mallPrice(bestPerfectDrink)) / 3;
  const splendidMartiniValuePerDrunk = (getAverageAdventures($item`splendid martini`) + 2) * VOA;

  const bonus = (Math.max(perfectDrinkValuePerDrunk, splendidMartiniValuePerDrunk) * 2) / 25;
  return new Map([[$item`designer sweatpants`, bonus]]);
}

const alternativePants = Item.all()
  .filter(
    (item) =>
      toSlot(item) === $slot`pants` && have(item) && numericModifier(item, "Adventures") > 0,
  )
  .map((pants) => numericModifier(pants, "Adventures"));
const bestAdventuresFromPants = Math.max(0, ...alternativePants);
const haveSomeCheese = getFoldGroup($item`stinky cheese diaper`).some((item) => have(item));
function cheeses(mode: BonusEquipMode) {
  return haveSomeCheese &&
    !globalOptions.ascend &&
    get("_stinkyCheeseCount") < 100 &&
    estimatedGarboTurns() >= 100 - get("_stinkyCheeseCount") &&
    mode !== BonusEquipMode.EMBEZZLER
    ? new Map<Item, number>(
        getFoldGroup($item`stinky cheese diaper`)
          .filter((item) => toSlot(item) !== $slot`weapon`)
          .map((item) => [
            item,
            get("valueOfAdventure") * (10 - bestAdventuresFromPants) * (1 / 100),
          ]),
      )
    : [];
}

function pantogramPants() {
  if (!have($item`pantogram pants`) || !get("_pantogramModifier").includes("Drops Items")) {
    return new Map<Item, number>([]);
  }

  // TODO: Calculate actual bonus value (good luck!)
  return new Map<Item, number>([[$item`pantogram pants`, 100]]);
}

function bagOfManyConfections() {
  if (!have($item`bag of many confections`) || !have($familiar`Stocking Mimic`)) {
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
  // Ignore for EMBEZZLER
  // Ignore for DMT, assuming mafia might get confused about the drop by the weird combats
  if (!have($item`Snow Suit`) || get("_carrotNoseDrops") >= 3 || !modeUseLimitedDrops(mode)) {
    return new Map<Item, number>([]);
  }

  return new Map<Item, number>([[$item`Snow Suit`, garboValue($item`carrot nose`) / 10]]);
}

function mayflowerBouquet(mode: BonusEquipMode) {
  // +40% meat drop 12.5% of the time (effectively 5%)
  // Drops flowers 50% of the time, wiki says 5-10 a day.
  // Theorized that flower drop rate drops off but no info on wiki.
  // During testing I got 4 drops then the 5th took like 40 more adventures
  // so let's just assume rate drops by 11% with a min of 1% ¯\_(ツ)_/¯

  // Ignore for EMBEZZLER
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
      (get("_mayflowerDrops") < 10 ? averageFlowerValue : 0) + sporadicMeatBonus,
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

export function bonusGear(
  mode: BonusEquipMode,
  valueCircumstantialBonus = true,
): Map<Item, number> {
  return new Map<Item, number>([
    ...cheeses(mode),
    ...bonusAccessories(mode),
    ...pantogramPants(),
    ...bagOfManyConfections(),
    ...stickers(mode),
    ...powerGlove(),
    ...(valueCircumstantialBonus
      ? new Map<Item, number>([
          ...pantsgiving(mode),
          ...sweatpants(mode),
          ...shavingBonus(),
          ...snowSuit(mode),
          ...mayflowerBouquet(mode),
          ...(mode === BonusEquipMode.BARF ? magnifyingGlass() : []),
          ...juneCleaver(mode),
        ])
      : []),
  ]);
}

function shavingBonus(): Map<Item, number> {
  if (!DaylightShavings.have() || DaylightShavings.buffs.some((buff) => have(buff, 2))) {
    return new Map();
  }

  const timeToMeatBuff = 11 * (DaylightShavings.buffsUntil($effect`Friendly Chops`) ?? Infinity);
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

  const bonusValue = (baseMeat * 100 + 72 * 50) / 100;
  return new Map<Item, number>([[$item`Daylight Shavings Helmet`, bonusValue]]);
}

let juneCleaverEV: number | null = null;
function juneCleaver(mode: BonusEquipMode): Map<Item, number> {
  const estimatedJuneCleaverTurns = remainingUserTurns() + estimatedGarboTurns();
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
        valueJuneCleaverOption(juneCleaverChoiceValues[choice][bestJuneCleaverOption(choice)]),
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
        valueJuneCleaverOption(juneCleaverChoiceValues[choice][bestJuneCleaverOption(choice)]),
      ) / JuneCleaver.choicesAvailable().length;
    const queueEV =
      sum([...JuneCleaver.queue()], (choice) => {
        const choiceValue = valueJuneCleaverOption(
          juneCleaverChoiceValues[choice][bestJuneCleaverOption(choice)],
        );
        const cleaverEncountersLeft = Math.floor(estimatedJuneCleaverTurns / 30);
        const encountersToQueueExit = 1 + JuneCleaver.queue().indexOf(choice);
        const chancesLeft = Math.max(0, cleaverEncountersLeft - encountersToQueueExit);
        const encounterProbability = 1 - Math.pow(2 / 3, chancesLeft);
        return choiceValue * encounterProbability;
      }) / JuneCleaver.queue().length;
    juneCleaverEV = queueEV + availEV;
  }

  const interval = mode === BonusEquipMode.EMBEZZLER ? 30 : JuneCleaver.getInterval();
  return new Map<Item, number>([[$item`June cleaver`, juneCleaverEV / interval]]);
}

function stickers(mode: BonusEquipMode): Map<Item, number> {
  // This function represents the _cost_ of using stickers
  // Embezzlers are the best monster to use them on, so there's functionally no cost
  if (mode === BonusEquipMode.EMBEZZLER) return new Map();

  const cost = sumNumbers(
    $slots`sticker1, sticker2, sticker3`.map((s) => mallPrice(equippedItem(s)) / 20),
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
      0.25 * garboAverageValue(...$items`blue pixel, green pixel, red pixel, white pixel`),
    ],
  ]);
}
