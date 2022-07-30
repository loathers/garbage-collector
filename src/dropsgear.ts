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
  findFairyMultiplier,
  findLeprechaunMultiplier,
  get,
  getAverageAdventures,
  getFoldGroup,
  getModifier,
  have,
  JuneCleaver,
  Modifiers,
  sumNumbers,
} from "libram";
import {
  createRiderMode,
  FamiliarRider,
  pickRider,
} from "libram/dist/resources/2010/CrownOfThrones";
import { mallMin } from "./diet";
import { estimatedTurns } from "./embezzler";
import { meatFamiliar } from "./familiar";
import {
  baseMeat,
  bestJuneCleaverOption,
  BonusEquipMode,
  globalOptions,
  juneCleaverChoiceValues,
  realmAvailable,
  valueJuneCleaverOption,
} from "./lib";
import { garboAverageValue, garboValue } from "./session";

/**
 * Determine the meat value of the modifier bonuses a particular bjorned familiar grants
 * @param mode The BonusEquipMode of this fight: "free", "dmt", "embezzler", or "barf"
 * @param modifiers An object containing any and all modifier-value pairs that the potential familiar choice grants
 * @returns The meat value of the modifier bonuses given that mode
 */
export function valueBjornModifiers(mode: BonusEquipMode, modifiers: Modifiers): number {
  const weight = modifiers["Familiar Weight"] ?? 0;
  const meat = modifiers["Meat Drop"] ?? 0;
  const item = modifiers["Item Drop"] ?? 0;

  const meatValue =
    (!["dmt", "free"].includes(mode) ? (baseMeat + mode === "embezzler" ? 750 : 0) : 0) / 100;
  const itemValue = mode === "barf" ? 0.72 : 0;

  const lepMult = findLeprechaunMultiplier(meatFamiliar());
  const lepBonus = weight * (2 * lepMult + Math.sqrt(lepMult));
  const fairyMult = findFairyMultiplier(meatFamiliar());
  const fairyBonus = weight * (fairyMult + Math.sqrt(fairyMult) / 2);

  const bjornMeatDropValue = meatValue * (meat + lepBonus);
  const bjornItemDropValue = itemValue * (item + fairyBonus);

  return bjornMeatDropValue + bjornItemDropValue;
}

createRiderMode("free", (modifiers: Modifiers) => valueBjornModifiers("free", modifiers), false);
createRiderMode(
  "embezzler",
  (modifiers: Modifiers) => valueBjornModifiers("embezzler", modifiers),
  true
);
createRiderMode("dmt", (modifiers: Modifiers) => valueBjornModifiers("dmt", modifiers), true);
createRiderMode(
  "barf",
  (modifiers: Modifiers) => valueBjornModifiers("barf", modifiers),
  false,
  true
);

/**
 * Determines the best familiar to bjornify given a particular fight mode
 * @param mode The BonusEquipMode of this fight: "free", "dmt", "embezzler", or "barf"
 * @returns The best familiar to bjornify given this fight mode
 */
export function pickBjorn(mode: BonusEquipMode = "free"): FamiliarRider {
  const attempt = pickRider(mode);
  if (attempt) return attempt;
  throw new Error("Unable to make a sensible bjorn decision");
}

const pantsgivingBonuses = new Map<number, number>();
function pantsgiving() {
  if (!have($item`Pantsgiving`)) return new Map<Item, number>();
  const count = get("_pantsgivingCount");
  const turnArray = [5, 50, 500, 5000];
  const index =
    myFullness() === fullnessLimit()
      ? get("_pantsgivingFullness")
      : turnArray.findIndex((x) => count < x);
  const turns = turnArray[index] || 50000;

  if (turns - count > estimatedTurns()) return new Map<Item, number>();

  const cachedBonus = pantsgivingBonuses.get(turns);
  if (cachedBonus) return new Map([[$item`Pantsgiving`, cachedBonus]]);

  const expectedSinusTurns = getWorkshed() === $item`portable Mayo Clinic` ? 100 : 50;
  const expectedUseableSinusTurns = globalOptions.ascending
    ? clamp(
        estimatedTurns() - (turns - count) - haveEffect($effect`Kicked in the Sinuses`),
        0,
        expectedSinusTurns
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

function sweatpants(equipMode: BonusEquipMode) {
  if (!have($item`designer sweatpants`) || equipMode === "embezzler") return new Map();

  const needSweat =
    (!globalOptions.ascending && get("sweat", 0) < 75) ||
    get("sweat", 0) < 25 * (3 - get("_sweatOutSomeBoozeUsed", 0));

  if (!needSweat) return new Map();

  const VOA = get("valueOfAdventure");

  const bestPerfectDrink = mallMin(
    $items`perfect cosmopolitan, perfect negroni, perfect dark and stormy, perfect mimosa, perfect old-fashioned, perfect paloma`
  );
  const perfectDrinkValuePerDrunk =
    ((getAverageAdventures(bestPerfectDrink) + 3) * VOA - mallPrice(bestPerfectDrink)) / 3;
  const splendidMartiniValuePerDrunk = (getAverageAdventures($item`splendid martini`) + 2) * VOA;

  const bonus = (Math.max(perfectDrinkValuePerDrunk, splendidMartiniValuePerDrunk) * 2) / 25;
  return new Map([[$item`designer sweatpants`, bonus]]);
}

const bestAdventuresFromPants =
  Item.all()
    .filter(
      (item) =>
        toSlot(item) === $slot`pants` && have(item) && numericModifier(item, "Adventures") > 0
    )
    .map((pants) => numericModifier(pants, "Adventures"))
    .sort((a, b) => b - a)[0] || 0;
const haveSomeCheese = getFoldGroup($item`stinky cheese diaper`).some((item) => have(item));
function cheeses(embezzlerUp: boolean) {
  return haveSomeCheese &&
    !globalOptions.ascending &&
    get("_stinkyCheeseCount") < 100 &&
    estimatedTurns() >= 100 - get("_stinkyCheeseCount") &&
    !embezzlerUp
    ? new Map<Item, number>(
        getFoldGroup($item`stinky cheese diaper`)
          .filter((item) => toSlot(item) !== $slot`weapon`)
          .map((item) => [
            item,
            get("valueOfAdventure") * (10 - bestAdventuresFromPants) * (1 / 100),
          ])
      )
    : [];
}

function mafiaThumbRing(equipMode: BonusEquipMode) {
  if (!have($item`mafia thumb ring`) || ["free", "dmt"].some((mode) => mode === equipMode)) {
    return new Map<Item, number>([]);
  }

  return new Map<Item, number>([
    [$item`mafia thumb ring`, (1 / 0.96 - 1) * get("valueOfAdventure")],
  ]);
}

function luckyGoldRing(equipMode: BonusEquipMode) {
  // Ignore for DMT, assuming mafia might get confused about the volcoino drop by the weird combats
  if (!have($item`lucky gold ring`) || equipMode === "dmt") {
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
  return new Map<Item, number>([[$item`Mr. Cheeng's spectacles`, 400]]);
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

function snowSuit(equipMode: BonusEquipMode) {
  // Ignore for EMBEZZLER
  // Ignore for DMT, assuming mafia might get confused about the drop by the weird combats
  if (
    !have($item`Snow Suit`) ||
    get("_carrotNoseDrops") >= 3 ||
    ["embezzler", "dmt"].some((mode) => mode === equipMode)
  ) {
    return new Map<Item, number>([]);
  }

  return new Map<Item, number>([[$item`Snow Suit`, garboValue($item`carrot nose`) / 10]]);
}

function mayflowerBouquet(equipMode: BonusEquipMode) {
  // +40% meat drop 12.5% of the time (effectively 5%)
  // Drops flowers 50% of the time, wiki says 5-10 a day.
  // Theorized that flower drop rate drops off but no info on wiki.
  // During testing I got 4 drops then the 5th took like 40 more adventures
  // so let's just assume rate drops by 11% with a min of 1% ¯\_(ツ)_/¯

  // Ignore for EMBEZZLER
  // Ignore for DMT, assuming mafia might get confused about the drop by the weird combats
  if (!have($item`Mayflower bouquet`) || ["embezzler", "dmt"].some((mode) => mode === equipMode)) {
    return new Map<Item, number>([]);
  }

  const sporadicMeatBonus = (40 * 0.125 * (equipMode === "barf" ? baseMeat : 0)) / 100;
  const averageFlowerValue =
    garboAverageValue(
      ...$items`tin magnolia, upsy daisy, lesser grodulated violet, half-orchid, begpwnia`
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
bonusGear() calls pantsgiving(), which calls estimatedTurns(), which calls usingThumbRing()
If this isn't separated from bonusGear(), usingThumbRing() will call bonusGear(), creating a dangerous loop
*/
function bonusAccessories(equipMode: BonusEquipMode): Map<Item, number> {
  return new Map<Item, number>([
    ...mafiaThumbRing(equipMode),
    ...luckyGoldRing(equipMode),
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
    [$item`cursed magnifying glass`, get("garbo_valueOfFreeFight", 2000) / 13],
  ]);
}

export function bonusGear(
  equipMode: BonusEquipMode,
  valueCircumstantialBonus = true
): Map<Item, number> {
  return new Map<Item, number>([
    ...cheeses(equipMode === "embezzler"),
    ...bonusAccessories(equipMode),
    ...pantogramPants(),
    ...bagOfManyConfections(),
    ...stickers(equipMode),
    ...(valueCircumstantialBonus
      ? new Map<Item, number>([
          ...(!["embezzler", "dmt"].includes(equipMode) ? pantsgiving() : []),
          ...sweatpants(equipMode),
          ...shavingBonus(),
          ...snowSuit(equipMode),
          ...mayflowerBouquet(equipMode),
          ...(equipMode === "barf" ? magnifyingGlass() : []),
          ...juneCleaver(equipMode),
        ])
      : []),
  ]);
}

export function bestBjornalike(existingForceEquips: Item[]): Item | undefined {
  const bjornalikes = $items`Buddy Bjorn, Crown of Thrones`;
  const slots = bjornalikes
    .map((bjornalike) => toSlot(bjornalike))
    .filter((slot) => !existingForceEquips.some((equipment) => toSlot(equipment) === slot));
  if (!slots.length) return undefined;
  if (slots.length < 2 || bjornalikes.some((thing) => !have(thing))) {
    return bjornalikes.find((thing) => have(thing) && slots.includes(toSlot(thing)));
  }

  const hasStrongLep = findLeprechaunMultiplier(meatFamiliar()) >= 2;
  const goodRobortHats = $items`crumpled felt fedora`;
  if (myClass() === $class`Turtle Tamer`) goodRobortHats.push($item`warbear foil hat`);
  if (numericModifier($item`shining star cap`, "Familiar Weight") === 10) {
    goodRobortHats.push($item`shining star cap`);
  }
  if (have($item`carpe`) && (!hasStrongLep || !goodRobortHats.some((hat) => have(hat)))) {
    return $item`Crown of Thrones`;
  }
  return $item`Buddy Bjorn`;
}

function shavingBonus(): Map<Item, number> {
  if (!DaylightShavings.have() || DaylightShavings.buffs.some((buff) => have(buff, 2))) {
    return new Map();
  }

  const timeToMeatBuff = 11 * (DaylightShavings.buffsUntil($effect`Friendly Chops`) ?? Infinity);
  if (globalOptions.ascending && timeToMeatBuff > estimatedTurns()) {
    return new Map();
  }

  if (
    !globalOptions.ascending &&
    DaylightShavings.nextBuff() === $effect`Friendly Chops` &&
    estimatedTurns() < 11 * 11
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
    const gear = bonusAccessories("barf");
    const accessoryBonuses = Array.from(gear.entries()).filter(([item]) => have(item));

    setLocation($location`Barf Mountain`);
    const meatAccessories = Item.all()
      .filter(
        (item) => have(item) && toSlot(item) === $slot`acc1` && getModifier("Meat Drop", item) > 0
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
        have($item`unwrapped knock-off retro superhero cape`))
    ) {
      accessoryValues.set($item`mafia pointer finger ring`, 500);
    }
    const bestAccessories = Array.from(accessoryValues.entries())
      .sort(([, aBonus], [, bBonus]) => bBonus - aBonus)
      .map(([item]) => item);
    cachedUsingThumbRing = bestAccessories.slice(0, 2).includes($item`mafia thumb ring`);
  }
  return cachedUsingThumbRing;
}

let juneCleaverEV: number | null = null;
function juneCleaver(equipMode: BonusEquipMode): Map<Item, number> {
  if (!have($item`June cleaver`) || get("_juneCleaverFightsLeft") > estimatedTurns()) {
    return new Map();
  }
  if (!juneCleaverEV) {
    juneCleaverEV =
      JuneCleaver.choices.reduce(
        (total, choice) =>
          total +
          valueJuneCleaverOption(juneCleaverChoiceValues[choice][bestJuneCleaverOption(choice)]),
        0
      ) / JuneCleaver.choices.length;
  }

  const interval = equipMode === "embezzler" ? 30 : JuneCleaver.getInterval();
  return new Map<Item, number>([[$item`June cleaver`, juneCleaverEV / interval]]);
}

function stickers(equipMode: BonusEquipMode): Map<Item, number> {
  if (equipMode === "embezzler") return new Map();

  const cost = sumNumbers(
    $slots`sticker1, sticker2, sticker3`.map((s) => mallPrice(equippedItem(s)) / 20)
  );
  return new Map([
    [$item`scratch 'n' sniff sword`, -1 * cost],
    [$item`scratch 'n' sniff crossbow`, -1 * cost],
  ]);
}
