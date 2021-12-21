import {
  fullnessLimit,
  getWorkshed,
  haveEffect,
  itemAmount,
  mallPrice,
  myClass,
  myFullness,
  numericModifier,
  toSlot,
} from "kolmafia";
import {
  $class,
  $effect,
  $effects,
  $familiar,
  $item,
  $items,
  $slot,
  get,
  getFoldGroup,
  getSaleValue,
  have,
  Modifiers,
  sumNumbers,
} from "libram";
import {
  createRiderMode,
  FamiliarRider,
  pickRider,
} from "libram/dist/resources/2010/CrownOfThrones";
import { estimatedTurns } from "./embezzler";
import { meatFamiliar } from "./familiar";
import {
  baseMeat,
  BonusEquipMode,
  fairyMultiplier,
  globalOptions,
  leprechaunMultiplier,
} from "./lib";

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

  const lepMult = leprechaunMultiplier(meatFamiliar());
  const lepBonus = weight * (2 * lepMult + Math.sqrt(lepMult));
  const fairyMult = fairyMultiplier(meatFamiliar());
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
    ? Math.min(
        estimatedTurns() - haveEffect($effect`Kicked in the Sinuses`),
        expectedSinusTurns,
        estimatedTurns() - (turns - count)
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
      itemAmount($item`sand dollar`) > 0 ? getSaleValue($item`sand dollar`) : 0, // This should be closeted
      itemAmount($item`Freddy Kruegerand`) > 0
        ? Math.max(
            getSaleValue($item`bottle of Bloodweiser`) / 200,
            getSaleValue($item`electric Kool-Aid`) / 200,
            getSaleValue($item`Dreadsylvanian skeleton key`) / 25
          )
        : 0,
      get("sleazeAirportAlways") || get("_sleazeAirportToday")
        ? getSaleValue($item`one-day ticket to Spring Break Beach`) / 100
        : 0,
      get("spookyAirportAlways") || get("_spookyAirportToday")
        ? Math.max(
            getSaleValue($item`one-day ticket to Conspiracy Island`) / 100,
            getSaleValue($item`karma shawarma`) / 7
          )
        : 0,
      get("stenchAirportAlways") || get("_stenchAirportToday")
        ? getSaleValue($item`one-day ticket to Dinseylandfill`) / 20
        : 0,
      (get("hotAirportAlways") || get("_hotAirportToday")) && !get("_luckyGoldRingVolcoino")
        ? getSaleValue($item`one-day ticket to That 70s Volcano`) / 3
        : 0,
      get("coldAirportAlways") || get("_coldAirportToday")
        ? getSaleValue($item`one-day ticket to The Glaciest`) / 50
        : 0,
      get("frAlways") || get("_frToday") ? getSaleValue($item`FantasyRealm guest pass`) / 350 : 0,
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
      getSaleValue(...$items`Polka Pop, BitterSweetTarts, Piddles`) / 6,
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
  )
    return new Map<Item, number>([]);

  return new Map<Item, number>([[$item`Snow Suit`, getSaleValue($item`carrot nose`) / 10]]);
}

function mayflowerBouquet(equipMode: BonusEquipMode) {
  // +40% meat drop 12.5% of the time (effectively 5%)
  // Drops flowers 50% of the time, wiki says 5-10 a day.
  // Theorized that flower drop rate drops off but no info on wiki.
  // During testing I got 4 drops then the 5th took like 40 more adventures
  // so let's just assume rate drops by 11% with a min of 1% ¯\_(ツ)_/¯

  // Ignore for EMBEZZLER
  // Ignore for DMT, assuming mafia might get confused about the drop by the weird combats
  if (!have($item`Mayflower bouquet`) || ["embezzler", "dmt"].some((mode) => mode === equipMode))
    return new Map<Item, number>([]);

  const sporadicMeatBonus = (40 * 0.125 * (equipMode === "barf" ? baseMeat : 0)) / 100;
  const averageFlowerValue =
    getSaleValue(
      ...$items`tin magnolia, upsy daisy, lesser grodulated violet, half-orchid, begpwnia`
    ) * Math.max(0.01, 0.5 - get("_mayflowerDrops") * 0.11);
  return new Map<Item, number>([
    [
      $item`Mayflower bouquet`,
      (get("_mayflowerDrops") < 10 ? averageFlowerValue : 0) + sporadicMeatBonus,
    ],
  ]);
}

export function bonusGear(equipMode: BonusEquipMode): Map<Item, number> {
  return new Map<Item, number>([
    ...cheeses(equipMode === "embezzler"),
    ...(equipMode === "embezzler" ? pantsgiving() : []),
    ...shavingBonus(),
    ...mafiaThumbRing(equipMode),
    ...luckyGoldRing(equipMode),
    ...mrCheengsSpectacles(),
    ...mrScreegesSpectacles(),
    ...pantogramPants(),
    ...bagOfManyConfections(),
    ...snowSuit(equipMode),
    ...mayflowerBouquet(equipMode),
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

  const hasStrongLep = leprechaunMultiplier(meatFamiliar()) >= 2;
  const goodRobortHats = $items`crumpled felt fedora`;
  if (myClass() === $class`Turtle Tamer`) goodRobortHats.push($item`warbear foil hat`);
  if (numericModifier($item`shining star cap`, "Familiar Weight") === 10)
    goodRobortHats.push($item`shining star cap`);
  if (have($item`carpe`) && (!hasStrongLep || !goodRobortHats.some((hat) => have(hat)))) {
    return $item`Crown of Thrones`;
  }
  return $item`Buddy Bjorn`;
}

function shavingBonus(): Map<Item, number> {
  if (!have($item`Daylight Shavings Helmet`)) return new Map();
  if (
    $effects`Barbell Moustache, Cowboy Stache, Friendly Chops, Grizzly Beard, Gull-Wing Moustache, Musician's Musician's Moustache, Pointy Wizard Beard, Space Warlord's Beard, Spectacle Moustache, Surrealist's Moustache, Toiletbrush Moustache`.some(
      (effect) => have(effect)
    )
  ) {
    return new Map();
  }

  const bonusValue = (baseMeat * 100 + 72 * 50) / 100;
  return new Map<Item, number>([[$item`Daylight Shavings Helmet`, bonusValue]]);
}

let usingThumb: boolean | null = null;
export function usingThumbRing(): boolean {
  if (usingThumb === null) {
    if (!have($item`mafia thumb ring`)) {
      usingThumb = false;
    } else {
      const gear = bonusGear("barf");
      usingThumb = Array.from(gear.entries())
        .filter(([item]) => have(item) && toSlot(item) === $slot`acc1`)
        .sort(([, aBonus], [, bBonus]) => bBonus - aBonus)
        .map(([item]) => item)
        .slice(0, 2)
        .includes($item`mafia thumb ring`);
    }
  }
  return usingThumb;
}
