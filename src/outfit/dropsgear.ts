import {
  equippedItem,
  fullnessLimit,
  getWorkshed,
  haveEffect,
  Item,
  itemAmount,
  mallPrice,
  myClass,
  myFullness,
  numericModifier,
  setLocation,
  toSlot,
} from "kolmafia";
import {
  $class,
  $effect,
  $familiar,
  $item,
  $items,
  $location,
  $skill,
  $slot,
  $slots,
  clamp,
  DaylightShavings,
  get,
  getAverageAdventures,
  getFoldGroup,
  getModifier,
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
  juneCleaverChoiceValues,
  realmAvailable,
  valueJuneCleaverOption,
} from "../lib";
import { garboAverageValue, garboValue } from "../value";
import { estimatedGarboTurns, remainingUserTurns } from "../turns";
import { BonusEquipMode, isFree, useLimitedDrops, valueOfMeat } from "./lib";

const pantsgivingBonuses = new Map<number, number>();
function pantsgiving(mode: BonusEquipMode) {
  if (!have($item`Pantsgiving`) || !useLimitedDrops(mode)) return new Map<Item, number>();
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

function mafiaThumbRing(mode: BonusEquipMode) {
  if (!have($item`mafia thumb ring`) || isFree(mode)) {
    return new Map<Item, number>([]);
  }

  return new Map<Item, number>([
    [$item`mafia thumb ring`, (1 / 0.96 - 1) * get("valueOfAdventure")],
  ]);
}

function luckyGoldRing(mode: BonusEquipMode) {
  // Ignore for DMT, assuming mafia might get confused about the volcoino drop by the weird combats
  if (!have($item`lucky gold ring`) || mode === BonusEquipMode.DMT) {
    return new Map<Item, number>([]);
  }

  // Volcoino has a low drop rate which isn't accounted for here
  // Overestimating until it drops is probably fine, don't @ me
  const dropValues = [
    100, // 80 - 120 meat
    ...[
      itemAmount($item`hobo nickel`) > 0 ? 100 : 0, // This should be closeted
      itemAmount($item`sand dollar`) > 0 ? garboValue($item`sand dollar`) : 0, // This should be closeted
      itemAmount($item`Freddy Kruegerand`) > 0 ? garboValue($item`Freddy Kruegerand`) : 0,
      realmAvailable("sleaze") ? garboValue($item`Beach Buck`) : 0,
      realmAvailable("spooky") ? garboValue($item`Coinspiracy`) : 0,
      realmAvailable("stench") ? garboValue($item`FunFunds™`) : 0,
      realmAvailable("hot") && !get("_luckyGoldRingVolcoino") ? garboValue($item`Volcoino`) : 0,
      realmAvailable("cold") ? garboValue($item`Wal-Mart gift certificate`) : 0,
      realmAvailable("fantasy") ? garboValue($item`Rubee™`) : 0,
    ].filter((value) => value > 0),
  ];

  // Items drop every ~10 turns
  return new Map<Item, number>([
    [$item`lucky gold ring`, sumNumbers(dropValues) / dropValues.length / 10],
  ]);
}

function mrCheengsSpectacles() {
  if (!have($item`Mr. Cheeng's spectacles`)) {
    return new Map<Item, number>([]);
  }

  // Items drop every 4 turns
  // TODO: Possible drops are speculated to be any pvpable potion that will never be banned by standard
  return new Map<Item, number>([[$item`Mr. Cheeng's spectacles`, 220]]);
}

function mrScreegesSpectacles() {
  if (!have($item`Mr. Screege's spectacles`)) {
    return new Map<Item, number>([]);
  }

  // TODO: Calculate actual bonus value (good luck!)
  return new Map<Item, number>([[$item`Mr. Screege's spectacles`, 180]]);
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
  if (!have($item`Snow Suit`) || get("_carrotNoseDrops") >= 3 || !useLimitedDrops(mode)) {
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
  if (!have($item`Mayflower bouquet`) || !useLimitedDrops(mode)) {
    return new Map<Item, number>([]);
  }

  const sporadicMeatBonus = (40 * 0.125 * valueOfMeat(mode)) / 100;
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

/*
This is separate from bonusGear to prevent circular references
bonusGear() calls pantsgiving(), which calls estimatedGarboTurns(), which calls usingThumbRing()
If this isn't separated from bonusGear(), usingThumbRing() will call bonusGear(), creating a dangerous loop
*/
function bonusAccessories(mode: BonusEquipMode): Map<Item, number> {
  return new Map<Item, number>([
    ...mafiaThumbRing(mode),
    ...luckyGoldRing(mode),
    ...mrCheengsSpectacles(),
    ...mrScreegesSpectacles(),
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

let cachedUsingThumbRing: boolean | null = null;
/**
 * Calculates whether we expect to be wearing the thumb ring for most of the farming day.
 * This is used in functions that leverage projected turns; for instance, calculating the
 * number of turns of sweet synthesis required in our diet calcs or potion costs.
 * @returns boolean of whether we expect to be wearing the thumb ring for much of the day
 */
export function usingThumbRing(): boolean {
  if (!have($item`mafia thumb ring`)) {
    return false;
  }
  if (cachedUsingThumbRing === null) {
    const gear = bonusAccessories(BonusEquipMode.BARF);
    const accessoryBonuses = [...gear.entries()].filter(([item]) => have(item));

    setLocation($location`Barf Mountain`);
    const meatAccessories = Item.all()
      .filter(
        (item) => have(item) && toSlot(item) === $slot`acc1` && getModifier("Meat Drop", item) > 0,
      )
      .map((item) => [item, (getModifier("Meat Drop", item) * baseMeat) / 100] as [Item, number]);

    const accessoryValues = new Map<Item, number>(accessoryBonuses);
    for (const [accessory, value] of meatAccessories) {
      accessoryValues.set(accessory, value + (accessoryValues.get(accessory) ?? 0));
    }

    if (
      have($item`mafia pointer finger ring`) &&
      ((myClass() === $class`Seal Clubber` && have($skill`Furious Wallop`)) ||
        have($item`haiku katana`) ||
        have($item`Operation Patriot Shield`) ||
        have($item`unwrapped knock-off retro superhero cape`) ||
        have($skill`Head in the Game`))
    ) {
      accessoryValues.set($item`mafia pointer finger ring`, 500);
    }
    const bestAccessories = [...accessoryValues.entries()]
      .sort(([, aBonus], [, bBonus]) => bBonus - aBonus)
      .map(([item]) => item);
    cachedUsingThumbRing = bestAccessories.slice(0, 2).includes($item`mafia thumb ring`);
  }
  return cachedUsingThumbRing;
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
