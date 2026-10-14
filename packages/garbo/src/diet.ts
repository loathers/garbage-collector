import {
  autosellPrice,
  availableAmount,
  buy,
  canAdventure,
  chew,
  cliExecute,
  dailySpecial,
  drink,
  eat,
  Effect,
  Element,
  elementalResistance,
  equippedItem,
  fullnessLimit,
  getClanLounge,
  getProperty,
  haveEffect,
  inebrietyLimit,
  Item,
  itemAmount,
  itemType,
  logprint,
  mallPrice,
  mpCost,
  myClass,
  myFamiliar,
  myFullness,
  myId,
  myInebriety,
  myLevel,
  myMaxhp,
  mySpleenUse,
  myThrall,
  npcPrice,
  numericModifier,
  print,
  putCloset,
  retrieveItem,
  retrievePrice,
  sellsItem,
  setProperty,
  Slot,
  spleenLimit,
  takeCloset,
  toEffect,
  toInt,
  toItem,
  toSkill,
  turnsPerCast,
  use,
  useFamiliar,
  useSkill,
  wait,
} from "kolmafia";
import {
  $class,
  $classes,
  $coinmaster,
  $effect,
  $effects,
  $element,
  $familiar,
  $item,
  $items,
  $locations,
  $modifier,
  $skill,
  $thrall,
  AsdonMartin,
  canRememberSong,
  clamp,
  DesignerSweatpants,
  Diet,
  get,
  getActiveSongs,
  getAverageAdventures,
  getModifier,
  getRemainingLiver,
  getSongCount,
  getSongLimit,
  have,
  Kmail,
  maxBy,
  maximizeCached,
  MayoClinic,
  MenuItem,
  PrismaticBeret,
  realmAvailable,
  set,
  sum,
  sumNumbers,
  uneffect,
  unequip,
  withProperties,
  withProperty,
} from "libram";
import { acquire, priceCaps } from "./acquire";
import { withVIPClan } from "./clan";
import { globalOptions } from "./config";
import { expectedGregs } from "./resources/extrovermectin";
import { shouldAugustCast } from "./resources/scepter";
import { synthesize } from "./resources/synthesis";
import {
  HIGHLIGHT,
  MEAT_TARGET_MULTIPLIER,
  targetingMeat,
  targetMeat,
  userConfirmDialog,
} from "./lib";
import { shrugBadEffects } from "./mood";
import { effectValueWithOpportunityCost, Potion, PotionTier } from "./potions";
import {
  estimatedGarboTurns,
  estimatedTurnsTomorrow,
  highMeatMonsterCount,
} from "./turns";
import { garboValue } from "./garboValue";
import { GarboWorkshed } from "./tasks/post/worksheds";
import { FarmingStrategy } from "./farmingStrategy";

const MPA = get("valueOfAdventure");
print(`Using adventure value ${MPA}.`, HIGHLIGHT);

const Mayo = MayoClinic.Mayo;
type Note = PotionTier | null;

function hasMoonZoneRestaurant(): boolean {
  return $locations`Camp Logging Camp, Thugnderdome`.some((loc) =>
    canAdventure(loc),
  );
}

function availableFromMoonZoneRestaurant(item: Item) {
  return hasMoonZoneRestaurant() && dailySpecial() === item;
}

function consumeWhileRespectingMoonRestaurant(command: () => void, item: Item) {
  const usingMoonZoneRestaurant = availableFromMoonZoneRestaurant(item);
  withProperties(
    {
      autoSatisfyWithCloset:
        !usingMoonZoneRestaurant && get("autoSatisfyWithCloset"),
      autoSatisfyWithMall: false,
    },
    command,
  );
}

function eatSafe(qty: number, item: Item) {
  if (
    have($item`Universal Seasoning`) &&
    $item`Universal Seasoning`.dailyusesleft > 0 &&
    !get("universalSeasoningActive")
  ) {
    use($item`Universal Seasoning`);
  }
  if (
    myLevel() >= 15 &&
    !get("_hungerSauceUsed") &&
    mallPrice($item`Hunger™ Sauce`) < 3 * MPA
  ) {
    acquire(1, $item`Hunger™ Sauce`, 3 * MPA);
    use($item`Hunger™ Sauce`);
  }
  if (mallPrice($item`fudge spork`) < 3 * MPA && !get("_fudgeSporkUsed")) {
    eat($item`fudge spork`);
  }
  if (
    myClass() === $class`Pastamancer` &&
    myThrall() !== $thrall`Spice Ghost` &&
    !get("_legendarySpiceGhostFood") &&
    $thrall`Spice Ghost`.level + (get("pumpkinSpiceWhorlUsed") ? 3 : 0) >= 11
  ) {
    useSkill($skill`Bind Spice Ghost`);
  }
  useIfUnused($item`milk of magnesium`, "_milkOfMagnesiumUsed", 5 * MPA);
  consumeWhileRespectingMoonRestaurant(() => {
    if (!eat(qty, item)) throw "Failed to eat safely";
  }, item);
}

const EXPENSIVE_SONGS = FarmingStrategy.isUnderwater()
  ? $effects`The Ballad of Richie Thingfinder, Chorale of Companionship, Donho's Bubbly Ballad`
  : $effects`The Ballad of Richie Thingfinder, Chorale of Companionship`;
const USEFUL_SONGS = $effects`Polka of Plenty, Ur-Kel's Aria of Annoyance, Fat Leon's Phat Loot Lyric`;
function shrugForOde() {
  const inexpensiveSongs = getActiveSongs().filter(
    (e) => !EXPENSIVE_SONGS.includes(e),
  );
  const uselessSongs = inexpensiveSongs.filter(
    (e) => !USEFUL_SONGS.includes(e),
  );
  if (uselessSongs.length >= 1) return uneffect(uselessSongs[0]);
  if (inexpensiveSongs.length === 1) return uneffect(inexpensiveSongs[0]);
  return uneffect(
    maxBy(inexpensiveSongs, (e) => haveEffect(e) * mpCost(toSkill(e)), true),
  );
}

function buskEffectValuer(effect: Effect, duration: number): number {
  if (effect === $effect`Salty Mouth`) return 5 * get("valueOfAdventure");
  if (
    effect === $effect`Hammertime` &&
    !have($effect`Hammertime`) &&
    get("_beretBuskingUses") === 0
  ) {
    return 1_000; // Arbitrary value, assume it will give upcoming busks more value if it's our first busk
  }
  return effectValueWithOpportunityCost(effect, duration);
}
function canBusk() {
  return PrismaticBeret.have() && get("_beretBuskingUses") < 5;
}
function buskForSaltyMouth() {
  if (!canBusk()) return;
  for (let i = get("_beretBuskingUses"); i < 5; i++) {
    if (have($effect`Salty Mouth`)) break;
    PrismaticBeret.buskFor(buskEffectValuer, {});
  }
}

function drinkSafe(qty: number, item: Item) {
  const prevDrunk = myInebriety();
  if (have($skill`The Ode to Booze`)) {
    if (!have($effect`Ode to Booze`) && getSongCount() >= getSongLimit()) {
      shrugForOde();
    }
    const odeTurns = qty * item.inebriety;
    const castTurns = odeTurns - haveEffect($effect`Ode to Booze`);
    if (castTurns > 0) {
      if (!canRememberSong() && !have($effect`Ode to Booze`)) {
        throw new Error("Unable to make a song slot for Ode to Booze!");
      }
      useSkill(
        $skill`The Ode to Booze`,
        Math.ceil(castTurns / turnsPerCast($skill`The Ode to Booze`)),
      );
    }
  }
  consumeWhileRespectingMoonRestaurant(() => {
    if (item.notes?.includes("BEER") && canBusk()) {
      for (let i = 0; i < qty; i++) {
        buskForSaltyMouth();
        if (!drink(1, item)) throw "Failed to drink safely";
      }
    } else if (!drink(qty, item)) throw "Failed to drink safely";
  }, item);

  if (item.inebriety === 1 && prevDrunk === qty + myInebriety() - 1) {
    // sometimes mafia does not track the mime army shotglass property
    setProperty("_mimeArmyShotglassUsed", "true");
  }
}

function chewSafe(qty: number, item: Item) {
  withProperty("autoSatisfyWithMall", false, () => {
    if (!chew(qty, item)) throw "Failed to chew safely";
  });
}

function consumeSafe(
  qty: number,
  item: Item,
  additionalValue?: number,
  skipAcquire?: boolean,
) {
  const spleenCleaned = spleenCleaners.get(item);
  if (spleenCleaned && mySpleenUse() < spleenCleaned) {
    throw "No spleen to clear with this.";
  }
  const averageAdventures = getAverageAdventures(item);
  const usingMoonZoneRestaurant = availableFromMoonZoneRestaurant(item);
  if (!skipAcquire && !usingMoonZoneRestaurant) {
    if (averageAdventures > 0 || additionalValue) {
      const cap = Math.max(0, averageAdventures * MPA) + (additionalValue ?? 0);
      acquire(qty, item, cap, true, undefined, true);
    } else {
      acquire(qty, item);
    }
  }
  // When eating the daily special, we need to closet any excess food, since it's much cheaper to eat the special
  const excessAmount = usingMoonZoneRestaurant ? itemAmount(item) : 0;
  if (usingMoonZoneRestaurant && itemAmount(item) > 0) {
    putCloset(item, excessAmount);
  }
  if (itemType(item) === "food" || item === saladFork) {
    eatSafe(qty, item);
    if (excessAmount > 0) takeCloset(item, excessAmount);
    return;
  }
  if (itemType(item) === "booze" || item === frostyMug) {
    drinkSafe(qty, item);
    if (excessAmount > 0) takeCloset(item, excessAmount);
    return;
  }
  if (itemType(item) === "spleen item") {
    chewSafe(qty, item);
    return;
  }
  use(qty, item);
}

function propTrue(prop: string | boolean) {
  if (typeof prop === "boolean") {
    return prop as boolean;
  } else {
    return get(prop);
  }
}

function useIfUnused(item: Item, prop: string | boolean, maxPrice: number) {
  if (!propTrue(prop)) {
    if (mallPrice(item) <= maxPrice) {
      acquire(1, item, maxPrice, false);
      if (!have(item)) return;
      use(1, item);
    } else {
      print(
        `Skipping ${item.name}; too expensive (${mallPrice(
          item,
        )} > ${maxPrice}).`,
      );
    }
  }
}

export function nonOrganAdventures(): void {
  useIfUnused(
    $item`fancy chocolate car`,
    get("_chocolatesUsed") !== 0,
    2 * MPA,
  );

  while (get("_loveChocolatesUsed") < 3) {
    const price = have($item`LOV Extraterrestrial Chocolate`) ? 15000 : 20000;
    const value =
      clamp(3 - get("_loveChocolatesUsed"), 0, 3) * get("valueOfAdventure");
    if (value < price) break;
    if (!have($item`LOV Extraterrestrial Chocolate`)) {
      Kmail.send(
        "sellbot",
        `${$item`LOV Extraterrestrial Chocolate`.name} (1)`,
        undefined,
        20000,
      );
      wait(11);
      cliExecute("refresh inventory");
      if (!have($item`LOV Extraterrestrial Chocolate`)) {
        print(
          "I'm tired of waiting for sellbot to send me some chocolate",
          "red",
        );
        break;
      }
    }
    use($item`LOV Extraterrestrial Chocolate`);
  }

  const chocos = new Map([
    [$class`Seal Clubber`, $item`chocolate seal-clubbing club`],
    [$class`Turtle Tamer`, $item`chocolate turtle totem`],
    [$class`Pastamancer`, $item`chocolate pasta spoon`],
    [$class`Sauceror`, $item`chocolate saucepan`],
    [$class`Accordion Thief`, $item`chocolate stolen accordion`],
    [$class`Disco Bandit`, $item`chocolate disco ball`],
  ]);
  const classChoco = chocos.get(myClass());
  const chocExpVal = (remaining: number, item: Item): number => {
    const advs = [0, 0, 1, 2, 3][remaining + (item === classChoco ? 1 : 0)];
    return advs * MPA - mallPrice(item);
  };
  const chocosRemaining = clamp(3 - get("_chocolatesUsed"), 0, 3);
  for (let i = chocosRemaining; i > 0; i--) {
    const chocoVals = [...chocos.values()].map((choc) => {
      return {
        choco: choc,
        value: chocExpVal(i, choc),
      };
    });
    const best = maxBy(chocoVals, "value");
    if (best.value > 0) {
      acquire(1, best.choco, best.value + mallPrice(best.choco), false);
      use(1, best.choco);
    } else break;
  }

  useIfUnused(
    $item`fancy chocolate sculpture`,
    get("_chocolateSculpturesUsed") > 0,
    5 * MPA + 5000,
  );
  useIfUnused($item`essential tofu`, "_essentialTofuUsed", 5 * MPA);

  if (!get("_etchedHourglassUsed") && have($item`etched hourglass`)) {
    use(1, $item`etched hourglass`);
  }

  if (
    getProperty("_timesArrowUsed") !== "true" &&
    mallPrice($item`time's arrow`) < 5 * MPA
  ) {
    acquire(1, $item`time's arrow`, 5 * MPA);
    cliExecute("csend 1 time's arrow to botticelli");
    setProperty("_timesArrowUsed", "true");
  }

  if (have($skill`Ancestral Recall`) && mallPrice($item`blue mana`) < 3 * MPA) {
    const casts = Math.max(10 - get("_ancestralRecallCasts"), 0);
    acquire(casts, $item`blue mana`, 3 * MPA);
    useSkill(casts, $skill`Ancestral Recall`);
  }

  if (globalOptions.ascend) {
    useIfUnused($item`borrowed time`, "_borrowedTimeUsed", 20 * MPA);
  }

  if (get("_extraTimeUsed", 3) < 3) {
    const extraTimeValue = (timesUsed: number): number => {
      const advs = [5, 3, 1][timesUsed];
      return advs * MPA;
    };
    const extraTimeUsed = get("_extraTimeUsed", 3);
    for (let i = extraTimeUsed; i < 3; i++) {
      if (extraTimeValue(i) > mallPrice($item`extra time`)) {
        if (acquire(1, $item`extra time`, extraTimeValue(i), false)) {
          use($item`extra time`);
        }
      } else break;
    }
  }

  if (get("_clocksUsed", 2) < 2) {
    const clockValue = (timesUsed: number): number => {
      const advs = [3, 2][timesUsed];
      return advs * MPA;
    };
    const clocksUsed = get("_clocksUsed", 2);
    for (let i = clocksUsed; i < 2; i++) {
      if (clockValue(i) > mallPrice($item`clock`)) {
        if (acquire(1, $item`clock`, clockValue(i), false)) {
          use($item`clock`);
        }
      } else break;
    }
  }
}

function pillCheck(): void {
  if (!get("_distentionPillUsed")) {
    if (
      !get("garbo_skipPillCheck", false) &&
      !have($item`distention pill`, 1)
    ) {
      set(
        "garbo_skipPillCheck",
        userConfirmDialog(
          "You do not have any distention pills. Continue anyway? (Defaulting to no in 15 seconds)",
          false,
          15000,
        ),
      );
    }
  }

  if (!get("_syntheticDogHairPillUsed")) {
    if (
      !get("garbo_skipPillCheck", false) &&
      !have($item`synthetic dog hair pill`, 1)
    ) {
      set(
        "garbo_skipPillCheck",
        userConfirmDialog(
          "You do not have any synthetic dog hair pills. Continue anyway? (Defaulting to no in 15 seconds)",
          false,
          15000,
        ),
      );
    }
  }
}

const saladFork = $item`Ol' Scratch's salad fork`;
const frostyMug = $item`Frosty's frosty mug`;
const spleenCleaners = new Map([
  [$item`extra-greasy slider`, 5],
  [$item`jar of fermented pickle juice`, 5],
  [$item`mojo filter`, 1],
]);
const stomachLiverCleaners = new Map([
  [$item`spice melange`, [-3, -3]],
  [$item`synthetic dog hair pill`, [0, -1]],
  [$item`cuppa Sobrie tea`, [0, -1]],
  [$item`designer sweatpants`, [0, -1]],
  [$item`august scepter`, [-1, 0]],
  [$item`Mr. Burnsger`, [4, -2]],
  [$item`Doc Clock's thyme cocktail`, [-2, 4]],
  [$item`The Plumber's mushroom stew`, [3, -1]],
  [$item`The Mad Liquor`, [-1, 3]],
]);

function legendaryPizzaToMenu(
  pizzas: { item: Item; pref: string }[],
  maker: (out: {
    item: Item;
    price: number;
  }) => MenuItem<Note> | MenuItem<Note>[],
) {
  if (!globalOptions.ascend) return [];
  const canCookLegendaryPizza = (pizza: Item): boolean => {
    const recipes = [
      pizza,
      ...$items`roasted vegetable of Jarlsberg, Pete's rich ricotta, Boris's bread`,
    ].map((i) => toInt(i));
    return !recipes.some((id) => get(`unknownRecipe${id}`, true));
  };
  return pizzas
    .filter(({ item, pref }) => !get(pref, true) && canCookLegendaryPizza(item))
    .map(({ item }) =>
      maker({
        item,
        price:
          2 *
          sum(
            $items`Vegetable of Jarlsberg, St. Sneaky Pete's Whey, Yeast of Boris`,
            ingredientCost,
          ),
      }),
    );
}

export const cheapestItem: (items: Item[]) => Item = (items: Item[]) =>
  maxBy(items, MenuItem.defaultPriceFunction, true);

/**
 * Generate a basic menu of high-yield items to consider
 * @returns basic menu
 */
function menu(): MenuItem<Note>[] {
  const spaghettiBreakfast =
    have($item`spaghetti breakfast`) &&
    myFullness() === 0 &&
    get("_timeSpinnerFoodAvailable") === "" &&
    !get("_spaghettiBreakfastEaten")
      ? 1
      : 0;

  /*
   * generated in mafia with an account that has super human cocktail crafting
   *  > js Item.all().filter((item) => item.inebriety > 0 && item.quality === "EPIC" && getIngredients(item)["mushroom fermenting powder]).join(", ")
   */
  const complexMushroomWines = $items`overpowering mushroom wine, complex mushroom wine, smooth mushroom wine, blood-red mushroom wine, buzzing mushroom wine, swirling mushroom wine`;
  /*
   * generated in mafia with:
   *  > js Item.all().filter((item) => item.inebriety > 0 && getIngredients(item)["perfect ice cube"]).join(", ")
   */
  const perfectDrinks = $items`perfect cosmopolitan, perfect negroni, perfect dark and stormy, perfect mimosa, perfect old-fashioned, perfect paloma`;
  /*
   * generated in mafia with an account that has Transcendental Noodlecraft
   *  > js Item.all().filter((item) => item.fullness > 0 && item.name.indexOf("lasagna") > 0 && getIngredients(item)["savory dry noodles"]).join(", ")
   */
  const lasagnas = $items`fishy fish lasagna, gnat lasagna, long pork lasagna`;

  /*
   * standardSpleenItem indicates a spleen item of size 4 with an adventure yield of 5-10. Taken from the wiki. They are all functionally equivalent.
   */
  const standardSpleenItems = $items`agua de vida, gooey paste, oily paste, ectoplasmic paste, greasy paste, bug paste, hippy paste, orc paste, demonic paste, indescribably horrible paste, fishy paste, goblin paste, pirate paste, chlorophyll paste, strange paste, Mer-kin paste, slimy paste, penguin paste, elemental paste, cosmic paste, hobo paste, Crimbo paste, groose grease, Unconscious Collective Dream Jar, grim fairy tale, powdered gold`;

  const smallEpics = [
    ...$items`meteoreo, ice rice`,
    $item`Tea, Earl Grey, Hot`,
  ];

  const crimboKeyValue = garboValue(
    toItem((toInt(myId()) % 4) + $item`pirate encryption key alpha`.id),
  );
  const boxingDayCareItems =
    $items`glass of raw eggs, punch-drunk punch`.filter((item) => have(item));
  const pilsners =
    globalOptions.usepilsners || globalOptions.ascend
      ? $items`astral pilsner`.filter((item) => have(item))
      : [];
  const instantKarma = globalOptions.usekarma
    ? $items`Instant Karma`.filter((item) => have(item))
    : [];
  const crimboKeyItem = cheapestItem(
    $items`corned beet, pickled bread, salted mutton`,
  );
  const limitedItems = [
    ...boxingDayCareItems,
    ...pilsners,
    ...instantKarma,
  ].map((item) => new MenuItem<Note>(item, { maximum: availableAmount(item) }));

  const legendaryPizzas = legendaryPizzaToMenu(
    [
      { item: $item`Calzone of Legend`, pref: "calzoneOfLegendEaten" },
      { item: $item`Pizza of Legend`, pref: "pizzaOfLegendEaten" },
    ],
    (out) =>
      new MenuItem<Note>(out.item, { maximum: 1, priceOverride: out.price }),
  );

  const dailySpecialItem =
    hasMoonZoneRestaurant() &&
    get("_dailySpecialPrice") < mallPrice(dailySpecial())
      ? [
          new MenuItem(dailySpecial(), {
            priceOverride: get("_dailySpecialPrice"),
          }),
        ]
      : [];

  return [
    // FOOD
    new MenuItem($item`Dreadsylvanian cold pocket`),
    new MenuItem($item`Dreadsylvanian hot pocket`),
    new MenuItem($item`Dreadsylvanian sleaze pocket`),
    new MenuItem($item`Dreadsylvanian stink pocket`),
    new MenuItem($item`Dreadsylvanian spooky pocket`),
    new MenuItem($item`tin cup of mulligan stew`),
    new MenuItem($item`frozen banquet`),
    new MenuItem($item`deviled egg`),
    new MenuItem($item`spaghetti breakfast`, { maximum: spaghettiBreakfast }),
    new MenuItem($item`extra-greasy slider`),
    new MenuItem(cheapestItem(lasagnas)),
    new MenuItem(cheapestItem(smallEpics)),
    new MenuItem($item`green hamhock`),
    ...legendaryPizzas.flat(),

    // BOOZE
    new MenuItem($item`elemental caipiroska`),
    new MenuItem($item`moreltini`),
    new MenuItem($item`Dreadsylvanian cold-fashioned`),
    new MenuItem($item`Dreadsylvanian dank and stormy`),
    new MenuItem($item`Dreadsylvanian grimlet`),
    new MenuItem($item`Dreadsylvanian hot toddy`),
    new MenuItem($item`Dreadsylvanian slithery nipple`),
    new MenuItem($item`Hodgman's blanket`),
    new MenuItem($item`Sacramento wine`),
    new MenuItem($item`iced plum wine`),
    new MenuItem($item`splendid martini`),
    new MenuItem($item`low tide martini`),
    new MenuItem($item`yam martini`),
    new MenuItem($item`Eye and a Twist`),
    new MenuItem($item`jar of fermented pickle juice`),
    new MenuItem(cheapestItem(complexMushroomWines)),
    new MenuItem(cheapestItem(perfectDrinks)),
    new MenuItem($item`green eggnog`),
    new MenuItem($item`can of Brütalbräu`, {
      additionalValue: garboValue($item`fancy tin beer can`),
    }),
    new MenuItem($item`can of Drooling Monk`, {
      additionalValue: garboValue($item`fancy tin beer can`),
    }),
    new MenuItem($item`can of Impetuous Scofflaw`, {
      additionalValue: garboValue($item`fancy tin beer can`),
    }),

    // SPLEEN
    new MenuItem($item`octolus oculus`),
    new MenuItem($item`prismatic wad`),
    new MenuItem($item`transdermal smoke patch`),
    new MenuItem($item`antimatter wad`),
    new MenuItem($item`voodoo snuff`),
    new MenuItem($item`blood-drive sticker`),
    new MenuItem(cheapestItem(standardSpleenItems)),
    new MenuItem(cheapestItem($items`not-a-pipe, glimmering roc feather`)),

    // MISC
    ...limitedItems,
    ...(crimboKeyValue >= mallPrice(crimboKeyItem)
      ? [
          new MenuItem(crimboKeyItem, {
            additionalValue: crimboKeyValue,
            maximum: clamp(
              // Restrict to a 3rd of our open stomach, capped at 5 to avoid using stomach cleansers
              Math.floor((fullnessLimit() - myFullness()) / 3),
              0,
              5,
            ),
          }),
        ]
      : []),
    ...dailySpecialItem,

    // HELPERS
    new MenuItem($item`distention pill`),
    new MenuItem($item`cuppa Voraci tea`),
    new MenuItem(Mayo.flex),
    new MenuItem(Mayo.zapine),
    new MenuItem($item`Special Seasoning`),
    new MenuItem($item`mini kiwi aioli`),
    new MenuItem($item`whet stone`),
    new MenuItem(saladFork),
    new MenuItem(frostyMug),
    new MenuItem($item`mojo filter`),
    new MenuItem($item`pocket wish`, {
      maximum: 1,
      effect: $effect`Refined Palate`,
    }),
    new MenuItem($item`toasted brie`, { maximum: 1 }),
    new MenuItem($item`potion of the field gar`, { maximum: 1 }),
    ...[...stomachLiverCleaners.keys()].map((item) => new MenuItem<Note>(item)),
    new MenuItem($item`sweet tooth`, {
      size: -1,
      organ: "food",
      maximum: get("_sweetToothUsed") ? 0 : 1,
    }),
    new MenuItem($item`designer sweatpants`, {
      size: -1,
      organ: "booze",
      maximum: DesignerSweatpants.availableCasts($skill`Sweat Out Some Booze`),
    }),
    new MenuItem($item`august scepter`, {
      size: -1,
      organ: "food",
      maximum: shouldAugustCast($skill`Aug. 16th: Roller Coaster Day!`) ? 1 : 0,
    }),
  ].filter((item) => item.price() < Infinity) as MenuItem<Note>[];
}

export function bestConsumable(
  organType: "booze" | "food" | "spleen",
  levelRestrict = true,
  restrictList?: Item | Item[],
  maxSize?: number,
): { edible: Item; value: number } {
  const fullMenu = potionMenu(menu(), 0, 0);
  let organMenu = fullMenu.filter(
    (menuItem) => itemType(menuItem.item) === organType,
  );
  if (restrictList) {
    if (restrictList instanceof Item) {
      organMenu = organMenu.filter(
        (menuItem) => restrictList !== menuItem.item,
      );
    } else {
      organMenu = organMenu.filter(
        (menuItem) => !restrictList.includes(menuItem.item),
      );
    }
  }
  if (maxSize) {
    organMenu = organMenu.filter((menuItem) => menuItem.size <= maxSize);
  }
  if (levelRestrict) {
    organMenu = organMenu.filter(
      (menuItem) => menuItem.item.levelreq <= myLevel(),
    );
  }
  const organList = organMenu.map((consumable) => {
    const edible = consumable.item;
    const buffs = getModifier("Effect", edible);
    const turnsPerUse = getModifier("Effect Duration", edible);
    const meatDrop = sum(buffs, (buff) =>
      getModifier("Meat Drop", toEffect(buff)),
    );
    const famWeight = sum(buffs, (buff) =>
      getModifier("Familiar Weight", toEffect(buff)),
    );
    const buffValue =
      ((meatDrop + (famWeight * 25) / 10) * turnsPerUse * targetMeat()) / 100;
    const advValue = getAverageAdventures(edible) * get("valueOfAdventure");
    const organSpace = consumable.size;
    return {
      edible: edible,
      value: (buffValue + advValue - mallPrice(edible)) / organSpace,
    };
  });
  const best = maxBy(organList, "value");
  return best;
}

function gregariousCount(): {
  expectedGregariousFights: number[];
  marginalGregariousFights: number;
} {
  const gregariousCharges =
    get("beGregariousCharges") +
    (get("beGregariousFightsLeft") > 0 &&
    get("beGregariousMonster") === globalOptions.target
      ? 1
      : 0);
  const gregariousFightsPerCharge = expectedGregs("extro");
  // remove and preserve the last index - that is the marginal count of gregarious fights
  const marginalGregariousFights = gregariousFightsPerCharge.splice(
    gregariousFightsPerCharge.length - 1,
    1,
  )[0];

  const expectedGregariousFights =
    gregariousFightsPerCharge.slice(gregariousCharges);

  return {
    expectedGregariousFights,
    marginalGregariousFights,
  };
}

function copiers(): MenuItem<Note>[] {
  const targetDifferential = targetingMeat()
    ? MEAT_TARGET_MULTIPLIER() * MPA
    : 0;
  const { expectedGregariousFights, marginalGregariousFights } =
    gregariousCount();
  const extros =
    myInebriety() > inebrietyLimit()
      ? []
      : [
          ...expectedGregariousFights.map(
            (targets) =>
              new MenuItem<Note>($item`Extrovermectin™`, {
                additionalValue: targets * targetDifferential,
                maximum: 1,
              }),
          ),
          new MenuItem<Note>($item`Extrovermectin™`, {
            additionalValue: marginalGregariousFights * targetDifferential,
          }),
        ];
  return [...extros];
}

function countCopies(diet: Diet<Note>): number {
  // this only counts the copies not yet realized
  // any copies already realized will be properly counted by copyTargetCount

  // returns an array of expected counts for number of greg copies to fight per pill use
  // the last value is how much you expect to fight per pill
  const extros = sum(diet.entries, ({ menuItems, quantity }) =>
    menuItems.some((menuItem) => menuItem.item === $item`Extrovermectin™`)
      ? quantity
      : 0,
  );
  const { expectedGregariousFights, marginalGregariousFights } =
    gregariousCount();

  // slice will never return an array that is bigger than the original array
  const replaceExtros = sumNumbers(expectedGregariousFights.slice(0, extros));
  const bonusExtros =
    clamp(extros - expectedGregariousFights.length, 0, extros) *
    marginalGregariousFights;

  return replaceExtros + bonusExtros;
}

function ingredientCost(item: Item): number {
  const ingredientMallPrice = mallPrice(item);
  const ingredientAutosellPrice = autosellPrice(item);

  if (
    !have(item) ||
    (item.tradeable &&
      ingredientMallPrice > Math.max(100, 2 * ingredientAutosellPrice))
  ) {
    return ingredientMallPrice;
  }
  return ingredientAutosellPrice;
}

/**
 * Generate a potion diet that has entries
 * @param targets number of target monsters expected to be encountered on this day
 * @param turns number of turns total expecte
 */
function potionMenu(
  baseMenu: MenuItem<Note>[],
  targets: number,
  turns: number,
): MenuItem<Note>[] {
  function limitedPotion(
    input: Item | Potion,
    limit?: number,
    options: {
      price?: number;
      organ?: "spleen item" | "booze" | "food";
      size?: number;
    } = {},
  ): MenuItem<Note>[] {
    if (limit === 0) {
      return [];
    }

    let potion = input instanceof Item ? new Potion(input) : input;
    let mayo: Item | undefined = undefined;
    if (
      itemType(potion.potion) === "food" &&
      (GarboWorkshed.current?.workshed === $item`portable Mayo Clinic` ||
        switchingToMayo())
    ) {
      potion = potion.doubleDuration();
      mayo = Mayo.zapine;
    }
    return potion.value(targets, turns, limit).map(
      (tier) =>
        new MenuItem(potion.potion, {
          maximum: tier.quantity,
          additionalValue: tier.value,
          priceOverride: options.price,
          organ: options.organ,
          size: options.size,
          data: tier.name,
          mayo,
        }),
    );
  }
  function potion(potion: Item | Potion, options = {}): MenuItem<Note>[] {
    return limitedPotion(potion, undefined, options);
  }

  const speakeasy = $item`Clan speakeasy`;
  const hasSpeakeasy = getClanLounge()[`${speakeasy}`];

  const twiceHauntedPrice =
    Math.min(
      ingredientCost($item`haunted orange`),
      ingredientCost($item`orange`) + ingredientCost($item`ghostly ectoplasm`),
    ) +
    Math.min(
      ingredientCost($item`haunted bottle of vodka`),
      ingredientCost($item`bottle of vodka`) +
        ingredientCost($item`ghostly ectoplasm`),
    );

  const campfireHotdog = get("getawayCampsiteUnlocked")
    ? potion($item`campfire hot dog`, {
        price: ingredientCost($item`stick of firewood`),
      })
    : [];

  const foodCone =
    realmAvailable("stench") || (globalOptions.simdiet && !globalOptions.nobarf)
      ? limitedPotion(
          $item`Dinsey food-cone`,
          Math.floor(availableAmount($item`FunFunds™`) / 2),
          {
            price: 2 * garboValue($item`FunFunds™`),
          },
        )
      : [];

  const borisBread = !get("unknownRecipe10978") // this property is true if you don't know the recipe, false if you do
    ? potion($item`Boris's bread`, {
        price: 2 * ingredientCost($item`Yeast of Boris`),
      })
    : [];

  const deepDish = legendaryPizzaToMenu(
    [{ item: $item`Deep Dish of Legend`, pref: "deepDishOfLegendEaten" }],
    (out: { item: Item; price: number }) =>
      limitedPotion(out.item, 1, { price: out.price }),
  );

  return [
    ...baseMenu,
    ...copiers(),

    // FOOD POTIONS
    ...potion($item`jumping horseradish`),
    ...potion($item`tempura cauliflower`),
    ...potion($item`sea truffle`),
    ...potion($item`tempura broccoli`),
    ...potion($item`Miserable Pie`),
    ...potion($item`Every Day is Like This Sundae`),
    ...potion($item`bowl of mummy guts`),
    ...potion($item`haunted Hell ramen`),
    ...campfireHotdog,
    ...foodCone,
    ...borisBread,
    ...deepDish.flat(),

    // BOOZE POTIONS
    ...potion($item`dirt julep`),
    ...potion($item`Ambitious Turkey`),
    ...potion($item`Friendly Turkey`),
    ...potion($item`vintage smart drink`),
    ...potion($item`Strikes Again Bigmouth`),
    ...potion($item`Irish Coffee, English Heart`),
    ...potion($item`Jack-O-Lantern beer`),
    ...potion($item`Amnesiac Ale`),
    ...potion($item`mentholated wine`),
    ...potion($item`Feliz Navidad`),
    ...potion($item`broberry brogurt`),
    ...potion($item`haunted martini`),
    ...potion($item`bottle of Greedy Dog`),
    ...potion($item`twice-haunted screwdriver`, { price: twiceHauntedPrice }),
    ...limitedPotion(
      $item`high-end ginger wine`,
      availableAmount($item`high-end ginger wine`),
    ),
    ...limitedPotion($item`Hot Socks`, hasSpeakeasy ? 3 : 0, { price: 5000 }),
    ...(realmAvailable("sleaze") &&
    sellsItem($coinmaster`The Frozen Brogurt Stand`, $item`broberry brogurt`)
      ? limitedPotion(
          $item`broberry brogurt`,
          Math.floor(itemAmount($item`Beach Buck`) / 10),
          {
            price: 10 * garboValue($item`Beach Buck`),
          },
        )
      : []),

    // SPLEEN POTIONS
    ...potion($item`cute mushroom`),
    ...potion($item`beggin' cologne`),
    ...potion($item`Knob Goblin nasal spray`),
    ...potion($item`handful of Smithereens`),
    ...potion($item`black striped oyster egg`),
    ...potion($item`black paisley oyster egg`),
    ...potion($item`black polka-dot oyster egg`),
    ...potion($item`lustrous oyster egg`),
    ...potion($item`glimmering buzzard feather`),
    ...potion($item`Knob Goblin pet-buffing spray`),
    ...potion($item`abstraction: joy`),
    ...potion($item`beastly paste`),
    ...potion($item`gleaming oyster egg`),
    ...potion($item`Party-in-a-Can™`),
    ...limitedPotion(
      $item`body spradium`,
      clamp(availableAmount($item`body spradium`), 0, 1),
    ),

    ...(have($skill`Sweet Synthesis`)
      ? potion(
          new Potion($item`Rethinking Candy`, {
            effect: $effect`Synthesis: Greed`,
            duration: 30,
          }),
          {
            size: 1,
            organ: "spleen item",
            price: 0,
          },
        )
      : []),
  ];
}

interface DietPlanner {
  (menu: MenuItem<Note>[]): Diet<Note>;
}
/**
 * Plan a diet, iteratively re-balancing it to account for potion duration and copytarget fights.
 * Early exits when it reaches a stable state; otherwise does 5 iterations.
 */
function planBalancedDiet(
  baseMenu: MenuItem<Note>[],
  dietPlanner: DietPlanner,
): Diet<Note> {
  const start = Date.now();
  let passes = 0;
  const timedPlanner = (menu: MenuItem<Note>[]) => {
    const passStart = Date.now();
    const diet = dietPlanner(menu);
    passes++;
    print(`Diet pass ${passes} took ${Date.now() - passStart}ms.`);
    return diet;
  };
  const finish = (diet: Diet<Note>) => {
    print(`Diet planned in ${Date.now() - start}ms over ${passes} passes.`);
    return diet;
  };
  const baseTargets = highMeatMonsterCount();
  const baseTurns = estimatedGarboTurns(false);
  let targets = 0;
  let adventures = timedPlanner(baseMenu).expectedAdventures();
  for (let iterations = 5; iterations > 0; iterations--) {
    print(
      `Calculating diet, please wait${".....".slice(0, iterations)}`,
      HIGHLIGHT,
    );
    const balancingDiet = timedPlanner(
      potionMenu(baseMenu, baseTargets + targets, baseTurns + adventures),
    );
    const nextTargets = countCopies(balancingDiet);
    const nextAdventures = balancingDiet.expectedAdventures();
    if (nextTargets === targets && nextAdventures === adventures) {
      return finish(balancingDiet);
    }
    targets = nextTargets;
    adventures = nextAdventures;
  }
  return finish(
    timedPlanner(
      potionMenu(baseMenu, baseTargets + targets, baseTurns + adventures),
    ),
  );
}

/**
 * Items that affect both stomach and liver, as [fullness, inebriety]; negative values clean.
 * These double diet planning time, because the knapsack is run with and without each of them.
 */
const crossOrganItems = new Map<Item, [number, number]>([
  [$item`spice melange`, [-3, -3]],
  [$item`Ultra Mega Sour Ball`, [-3, -3]],
  [$item`The Plumber's mushroom stew`, [3, -1]],
  [$item`The Mad Liquor`, [-1, 3]],
  [$item`Doc Clock's thyme cocktail`, [-2, 4]],
  [$item`Mr. Burnsger`, [4, -2]],
]);

/**
 * An upper bound on the adventures from an item, including all possible bonuses.
 * Used to find items whose best case is still negative, so we can prune them from the menu.
 */
function maxAdventures(menuItem: MenuItem<Note>): number {
  const { adventures, fullness } = menuItem.item;
  if (!adventures) return 0;
  const range = adventures.match(/^(-?\d+)(?:-(-?\d+))?$/);
  if (!range) return Infinity;
  const max = Number(range[2] ?? range[1]);
  // fork/mug, then saucemaven and gar-ish
  let result = Math.floor(max * 1.5) + 5 + 5;
  // refined palate, pinky ring, tuxedo shirt
  result = Math.ceil(Math.floor(result * 1.25) * 1.125) + 2;
  if (menuItem.itemType() === "food") {
    // mayoflex, seasoning, aioli, whet stone
    result += 1 + 1 + fullness + 1;
  }
  return result;
}

/**
 * Prune items that can't possibly be in our planned diet (i.e., items with negative value).
 * Accounts for cross-organ items by assuming that we fill the cleaned space with
 * optimal choices.
 */
function withoutHopelessItems(menu: MenuItem<Note>[]): MenuItem<Note>[] {
  const valueUpperBound = (menuItem: MenuItem<Note>) =>
    maxAdventures(menuItem) * MPA +
    (menuItem.additionalValue ?? 0) -
    menuItem.price();

  const spleenRatio = Math.max(
    0,
    ...menu
      .filter(
        (menuItem) => menuItem.organ === "spleen item" && menuItem.size > 0,
      )
      .map((menuItem) => valueUpperBound(menuItem) / menuItem.size),
  );
  const spleenCleaningValue = (menuItem: MenuItem<Note>) =>
    $items`jar of fermented pickle juice, extra-greasy slider`.includes(
      menuItem.item,
    )
      ? 5 * spleenRatio
      : 0;

  const ratioAndValue = (organ: Organ) => {
    let ratio = 0;
    let value = 0;
    for (const menuItem of menu) {
      if (menuItem.organ !== organ || crossOrganItems.has(menuItem.item)) {
        continue;
      }
      // Negative-size items are planned as "not using them", worth -value
      const itemValue =
        menuItem.size > 0
          ? valueUpperBound(menuItem) + spleenCleaningValue(menuItem)
          : ["food", "booze"].includes(menuItem.itemType())
            ? Infinity
            : menuItem.price() - (menuItem.additionalValue ?? 0);
      if (menuItem.size === 0 || itemValue <= 0) continue;
      ratio = Math.max(ratio, itemValue / Math.abs(menuItem.size));
      value = Math.max(value, itemValue);
    }
    return { ratio, value };
  };
  const food = ratioAndValue("food");
  const booze = ratioAndValue("booze");
  const freedSpaceValue = (size: number, { ratio, value }: typeof food) =>
    size < 0 ? -size * ratio + value : 0;
  // An overfull organ makes the planner's "without" case invalid; don't guess.
  const overfull =
    myFullness() > fullnessLimit() || myInebriety() > inebrietyLimit();

  // Items whose value depends on the rest of the diet, like Refined Palate
  const modifierItems = $items`pocket wish, toasted brie, potion of the field gar`;

  const bestCase = (menuItem: MenuItem<Note>): number => {
    const sizes = crossOrganItems.get(menuItem.item);
    if (sizes) {
      if (overfull) return Infinity;
      const [fullness, inebriety] = sizes;
      return (
        valueUpperBound(menuItem) +
        freedSpaceValue(fullness, food) +
        freedSpaceValue(inebriety, booze)
      );
    }
    if (
      menuItem.organ &&
      menuItem.size > 0 &&
      !modifierItems.includes(menuItem.item)
    ) {
      return valueUpperBound(menuItem) + spleenCleaningValue(menuItem);
    }
    // Helpers, organ expanders, and cleaners are valued by the planner in context
    return Infinity;
  };

  return menu.filter(
    (menuItem) =>
      (menuItem.maximum !== undefined && menuItem.maximum <= 0) ||
      !(bestCase(menuItem) < 0),
  );
}

/**
 * Prune out any unlimited item that is strictly surpassed by another unlimited item.
 * Accounts for forks, mugs, refined palate, etc; doesn't account for proper divisors
 * of the organ-size (e.g., a size-6 item will not be obsoleted by a stronger size-3 item).
 */
function withoutDominatedItems(menu: MenuItem<Note>[]): MenuItem<Note>[] {
  const isCandidate = (menuItem: MenuItem<Note>) =>
    menuItem.maximum === undefined &&
    menuItem.size > 0 &&
    (["food", "booze", "spleen item"] as (Organ | undefined)[]).includes(
      menuItem.organ,
    ) &&
    menuItem.additionalValue === undefined &&
    menuItem.effect === undefined &&
    menuItem.mayo === undefined &&
    menuItem.data === undefined &&
    menuItem.item.levelreq <= myLevel() &&
    !crossOrganItems.has(menuItem.item) &&
    !stomachLiverCleaners.has(menuItem.item) &&
    !spleenCleaners.has(menuItem.item);

  const seasoning = menu.find(
    (menuItem) => menuItem.item === $item`Special Seasoning`,
  );
  const forkMug = (menuItem: MenuItem<Note>) =>
    menuItem.organ === "food"
      ? new MenuItem<Note>(saladFork)
      : menuItem.organ === "booze"
        ? new MenuItem<Note>(frostyMug)
        : undefined;
  // Zero-quantity entries switch on the diet-wide effects without adding adventures
  const palate = new MenuItem<Note>($item`toasted brie`);
  const garish = new MenuItem<Note>($item`potion of the field gar`);
  const scenarios = [false, true].flatMap((useForkMug) =>
    [[], [palate], [garish], [palate, garish]].map((modifiers) => ({
      useForkMug,
      modifiers,
    })),
  );

  const value = (
    menuItem: MenuItem<Note>,
    { useForkMug, modifiers }: (typeof scenarios)[number],
  ): number => {
    const helper = useForkMug ? forkMug(menuItem) : undefined;
    const helperSets = [helper ? [helper] : []];
    if (seasoning && menuItem.organ === "food") {
      helperSets.push([...helperSets[0], seasoning]);
    }
    return Math.max(
      ...helperSets.map((helpers) => {
        const adventures = Diet.from<Note>([
          [[...helpers, menuItem], 1],
          ...modifiers.map((modifier): [MenuItem<Note>[], number] => [
            [modifier],
            0,
          ]),
        ]).expectedAdventures();
        const helperCost = helpers.includes(seasoning as MenuItem<Note>)
          ? (seasoning as MenuItem<Note>).price()
          : 0;
        return adventures * MPA - menuItem.price() - helperCost;
      }),
    );
  };

  const groups = new Map<string, MenuItem<Note>[]>();
  for (const menuItem of menu.filter(isCandidate)) {
    const key = `${menuItem.organ}:${menuItem.size}`;
    groups.set(key, [...(groups.get(key) ?? []), menuItem]);
  }
  const kept = new Set<MenuItem<Note>>();
  for (const group of groups.values()) {
    for (const scenario of scenarios) {
      kept.add(maxBy(group, (menuItem) => value(menuItem, scenario)));
    }
  }

  return menu.filter(
    (menuItem) => !isCandidate(menuItem) || kept.has(menuItem),
  );
}

export function computeDiet(): {
  diet: () => Diet<Note>;
  shotglass: () => Diet<Note>;
  pantsgiving: () => Diet<Note>;
  sweatpants: () => Diet<Note>;
} {
  // Handle spleen manually, as the diet planner doesn't support synth. Only fill food and booze.

  const orEmpty = (diet: Diet<Note>) =>
    diet.expectedValue(MPA, "net") < 0 ? new Diet<Note>() : diet;
  const plan = (
    menu: MenuItem<Note>[],
    organCapacities?: Parameters<typeof Diet.plan>[2],
  ) =>
    orEmpty(
      Diet.plan(
        MPA,
        withoutDominatedItems(withoutHopelessItems(menu)),
        organCapacities,
      ),
    );
  const fullDietPlanner = (menu: MenuItem<Note>[]) => plan(menu);
  const shotglassDietPlanner = (menu: MenuItem<Note>[]) =>
    plan(menu, { booze: 1 });
  const pantsgivingDietPlanner = (menu: MenuItem<Note>[]) =>
    plan(menu, { food: 1 });
  const sweatpantsDietPlanner = (menu: MenuItem<Note>[]) =>
    plan(menu, { booze: getRemainingLiver() });
  // const shotglassFilter = (menuItem: MenuItem)

  return {
    diet: () =>
      planBalancedDiet(
        menu().filter(
          (menuItem) =>
            !priceCaps[menuItem.item.name] ||
            priceCaps[menuItem.item.name] >= mallPrice(menuItem.item),
        ),
        fullDietPlanner,
      ),
    shotglass: () =>
      planBalancedDiet(
        menu().filter(
          (menuItem) =>
            itemType(menuItem.item) === "booze" && menuItem.size === 1,
        ),
        shotglassDietPlanner,
      ),
    pantsgiving: () =>
      planBalancedDiet(
        menu().filter(
          (menuItem) =>
            (itemType(menuItem.item) === "food" && menuItem.size === 1) ||
            [
              Mayo.flex,
              Mayo.zapine,
              $item`Special Seasoning`,
              $item`mini kiwi aioli`,
              $item`whet stone`,
            ].includes(menuItem.item),
        ),
        pantsgivingDietPlanner,
      ),
    sweatpants: () =>
      planBalancedDiet(
        menu().filter(
          (menuItem) =>
            itemType(menuItem.item) === "booze" && menuItem.size <= 3,
        ),
        sweatpantsDietPlanner,
      ),
  };
}

type DietName = "FULL" | "SHOTGLASS" | "PANTSGIVING" | "SWEATPANTS";

function printDiet(diet: Diet<Note>, name: DietName) {
  print(`===== ${name} DIET =====`);
  if (diet.entries.length === 0) return;
  diet = diet.copy();
  diet.entries.sort(
    (a, b) => itemPriority(b.menuItems) - itemPriority(a.menuItems),
  );

  const targets = Math.floor(highMeatMonsterCount() + countCopies(diet));
  const adventures = Math.floor(
    estimatedGarboTurns(false) + diet.expectedAdventures(),
  );
  print(
    `Planning to fight ${targets} ${globalOptions.target} and run ${adventures} adventures`,
  );

  for (const dietEntry of diet.entries) {
    if (dietEntry.quantity === 0) continue;
    const target = dietEntry.target();
    const datastr = target.data ? `(${target.data})` : "";
    const maxstr = target.maximum ? ` (max ${target.maximum})` : "";
    const helpersstr =
      dietEntry.helpers().length > 0
        ? ` helpers: ${dietEntry.helpers().join(", ")}`
        : "";
    const addvalstr = target.additionalValue
      ? ` (additional value: ${target.additionalValue})`
      : "";
    const valuestr = `value: ${Math.floor(
      dietEntry.expectedValue(MPA, diet),
    )}${addvalstr} price: ${Math.floor(dietEntry.expectedPrice())}`;
    print(
      `${dietEntry.quantity}${maxstr} ${target}${datastr}${helpersstr} ${valuestr}`,
    );
  }
  const totalValue = diet.expectedValue(MPA);
  const totalCost = diet.expectedPrice();
  const netValue = totalValue - totalCost;
  print(
    `Assuming MPA of ${MPA}, Total Cost ${totalCost}, Total Value ${totalValue}, Net Value ${netValue}`,
  );
}

// Item priority - higher means we eat it first.
// Anything that gives a consumption buff should go first (e.g. Refined Palate).
function itemPriority<T>(menuItems: MenuItem<T>[] | readonly MenuItem<T>[]) {
  // Last menu item is the food itself.
  const menuItem = menuItems[menuItems.length - 1];
  if (menuItem === undefined) {
    throw "Shouldn't have an empty menu item.";
  }
  if (menuItem.item === $item`spaghetti breakfast`) return 200;
  if (
    $items`pocket wish, toasted brie`.includes(menuItem.item) ||
    spleenCleaners.get(menuItem.item) ||
    stomachLiverCleaners.get(menuItem.item)
  ) {
    return 100;
  } else {
    return 0;
  }
}

/**
 * A representation of a single diet step (eating, drinking, using, etc.)
 */
interface DietTask {
  name: string;
  perform(): void;
}

type ItemAction = (countToConsume: number, menuItem: MenuItem<Note>) => void;

const consumeAction: ItemAction = (countToConsume, menuItem) =>
  consumeSafe(countToConsume, menuItem.item, menuItem.additionalValue);

const elementalResistAction =
  (element: Element): ItemAction =>
  (countToConsume, menuItem) => {
    if (myMaxhp() < 1000 * (1 - elementalResistance(element) / 100)) {
      maximizeCached(["0.05 HP", `${element} Resistance`]);
      if (myMaxhp() < 1000 * (1 - elementalResistance(element) / 100)) {
        throw `Could not achieve enough ${element} resistance for ${menuItem.item}.`;
      }
    }
    consumeSafe(countToConsume, menuItem.item);
  };

/**
 * Menu items that need something other than `consumeAction`.
 */
function specialItemActions(): Map<Item, ItemAction> {
  const speakeasyDrinks = Object.keys(getClanLounge())
    .map((s) => toItem(s))
    .filter((i) => i.inebriety > 0);
  return new Map<Item, ItemAction>([
    [saladFork, elementalResistAction($element`hot`)],
    [frostyMug, elementalResistAction($element`cold`)],
    [
      $item`pocket wish`,
      (countToConsume, menuItem) => {
        if (acquire(countToConsume, $item`pocket wish`, 60000)) {
          cliExecute(`genie effect ${menuItem.effect}`);
        }
      },
    ],
    [
      $item`campfire hot dog`,
      (countToConsume, menuItem) => {
        // mafia does not support retrieveItem on campfire hot dog because it does not work on stick of firewood
        if (!have($item`stick of firewood`)) {
          buy(
            1,
            $item`stick of firewood`,
            ingredientCost($item`stick of firewood`),
          );
        }
        consumeSafe(countToConsume, menuItem.item);
      },
    ],
    // Special Seasoning is acquired by its own task and used automatically
    [$item`Special Seasoning`, () => {}],
    [
      $item`mini kiwi aioli`,
      (countToConsume, menuItem) => {
        retrieveItem(menuItem.item, countToConsume);
        use(menuItem.item);
      },
    ],
    [
      $item`Rethinking Candy`,
      (countToConsume, menuItem) => {
        synthesize(
          countToConsume,
          menuItem.effect ?? $effect`Synthesis: Greed`,
        );
      },
    ],
    ...Object.values(Mayo).map((mayo): [Item, ItemAction] => [
      mayo,
      (countToConsume, menuItem) =>
        MayoClinic.setMayoMinder(menuItem.item, countToConsume),
    ]),
    ...speakeasyDrinks.map((drink): [Item, ItemAction] => [
      drink,
      (countToConsume, menuItem) => {
        cliExecute(`drink ${countToConsume} ${menuItem.item}`);
      },
    ]),
    [
      $item`broberry brogurt`,
      (countToConsume, menuItem) => {
        const amountNeeded =
          countToConsume - availableAmount($item`broberry brogurt`);
        if (amountNeeded > 0) {
          const coinmasterPrice =
            realmAvailable("sleaze") &&
            sellsItem(
              $coinmaster`The Frozen Brogurt Stand`,
              $item`broberry brogurt`,
            )
              ? 10 * garboValue($item`Beach Buck`)
              : Infinity;
          const regularPrice = mallPrice($item`broberry brogurt`);
          if (coinmasterPrice < regularPrice) {
            const amountToBuy = Math.min(
              amountNeeded,
              Math.floor(itemAmount($item`Beach Buck`)),
            );
            buy(
              $coinmaster`The Frozen Brogurt Stand`,
              amountToBuy,
              $item`broberry brogurt`,
            );
          }
          buy(
            countToConsume - availableAmount($item`broberry brogurt`),
            $item`broberry brogurt`,
          );
        }
        consumeSafe(countToConsume, menuItem.item, menuItem.additionalValue);
      },
    ],
    [
      $item`designer sweatpants`,
      (countToConsume) => {
        for (let n = 1; n <= countToConsume; n++) {
          useSkill($skill`Sweat Out Some Booze`);
        }
      },
    ],
    [
      $item`august scepter`,
      () => useSkill($skill`Aug. 16th: Roller Coaster Day!`),
    ],
  ]);
}

function acquireSeasoningTask(diet: Diet<Note>): DietTask {
  const seasoningCount = sum(diet.entries, ({ menuItems, quantity }) =>
    menuItems.some((menuItem) => menuItem.item === $item`Special Seasoning`)
      ? quantity
      : 0,
  );
  return {
    name: `Acquire ${seasoningCount} Special Seasoning`,
    perform: () => acquire(seasoningCount, $item`Special Seasoning`, MPA),
  };
}

type Organ = "food" | "booze" | "spleen item";
type OrganAmounts = Record<Organ, number>;
const ORGANS: Organ[] = ["food", "booze", "spleen item"];
const noOrgans = (): OrganAmounts => ({ food: 0, booze: 0, "spleen item": 0 });

/**
 * Determine the total organ-filling and organ-cleansing of a given item.
 * We only ever want to eat a cleanser if it can actually cleanse, so we need
 * to sequence our diet using this information.
 */
function organEffects(menuItems: readonly MenuItem<Note>[]): {
  fills: OrganAmounts;
  cleans: OrganAmounts;
} {
  const fills = noOrgans();
  const cleans = noOrgans();
  for (const menuItem of menuItems) {
    const cleaning = stomachLiverCleaners.get(menuItem.item);
    const spleenCleaned = spleenCleaners.get(menuItem.item);
    if (cleaning) {
      const [fullness, inebriety] = cleaning;
      if (fullness < 0) cleans.food -= fullness;
      else fills.food += fullness;
      if (inebriety < 0) cleans.booze -= inebriety;
      else fills.booze += inebriety;
    } else if (
      menuItem.organ &&
      !(spleenCleaned && menuItem.organ === "spleen item")
    ) {
      fills[menuItem.organ] += menuItem.size;
    }
    if (spleenCleaned) cleans["spleen item"] += spleenCleaned;
  }
  return { fills, cleans };
}

/**
 * Creates a `DietTask` for a given `DietEntry` and `countToConsume`.
 */
function dietEntryTask(
  dietEntry: Diet<Note>["entries"][number],
  countToConsume: number,
  actions: Map<Item, ItemAction>,
): DietTask {
  const steps = dietEntry.menuItems.map((menuItem) => ({
    menuItem,
    action: actions.get(menuItem.item) ?? consumeAction,
  }));
  return {
    name: `${countToConsume} ${dietEntry.target()}`,
    perform: () => {
      for (const { menuItem, action } of steps) {
        action(countToConsume, menuItem);
      }
    },
  };
}

/**
 * Transform a diet into an array of diet tasks that can be carried out in order.
 * For example, cleansers are sequenced after there is filled organ space for them to clear.
 * Throws before anything is consumed if there is no order that fits.
 */
function dietTasks(diet: Diet<Note>): DietTask[] {
  const actions = specialItemActions();
  const tasks = [acquireSeasoningTask(diet)];

  const used: OrganAmounts = {
    food: myFullness(),
    booze: myInebriety(),
    "spleen item": mySpleenUse(),
  };
  const capacity: OrganAmounts = {
    food: fullnessLimit(),
    booze: inebrietyLimit(),
    "spleen item": spleenLimit(),
  };
  let shotglassAvailable =
    !get("_mimeArmyShotglassUsed") && have($item`mime army shotglass`);

  const pending = [...diet.entries]
    .sort((a, b) => itemPriority(b.menuItems) - itemPriority(a.menuItems))
    .map((dietEntry) => ({
      dietEntry,
      remaining: dietEntry.quantity,
      ...organEffects(dietEntry.menuItems),
    }));

  // How many of an entry we can consume right now, and whether the first one goes in the shotglass
  const fit = (entry: (typeof pending)[number]) => {
    const { fills, cleans } = entry;
    const usesShotglass =
      shotglassAvailable &&
      entry.dietEntry.menuItems.some(
        (menuItem) => menuItem.organ === "booze" && menuItem.size === 1,
      );
    const fill = (organ: Organ) =>
      usesShotglass && organ === "booze" ? 0 : fills[organ];
    let count = usesShotglass ? 1 : entry.remaining;
    for (const organ of ORGANS) {
      if (fill(organ) > 0) {
        count = Math.min(
          count,
          Math.floor((capacity[organ] - used[organ]) / fill(organ)),
        );
      }
      if (cleans[organ] > 0) {
        count = Math.min(count, Math.floor(used[organ] / cleans[organ]));
      }
    }
    return { count, usesShotglass, fill };
  };

  // Always schedule the highest priority entry that fits, so that space freed by
  // a cleaner goes to the entries that were waiting on it.
  while (pending.some(({ remaining }) => remaining > 0)) {
    const next = pending
      .filter(({ remaining }) => remaining > 0)
      .map((entry) => ({ entry, ...fit(entry) }))
      .find(({ count }) => count > 0);
    if (!next) {
      const stuck = pending
        .filter(({ remaining }) => remaining > 0)
        .map(
          ({ dietEntry, remaining }) => `${remaining} ${dietEntry.target()}`,
        );
      throw `Unable to find an order to consume this diet; could not fit ${stuck.join(", ")}.`;
    }
    const { entry, count, usesShotglass, fill } = next;
    for (const organ of ORGANS) {
      used[organ] += count * (fill(organ) - entry.cleans[organ]);
    }
    if (usesShotglass) shotglassAvailable = false;
    entry.remaining -= count;
    tasks.push(dietEntryTask(entry.dietEntry, count, actions));
  }
  return tasks;
}

export function consumeDiet(diet: Diet<Note>, name: DietName): void {
  if (diet.entries.length === 0) return;

  print();
  printDiet(diet, name);
  print();

  const tasks = dietTasks(diet);
  logprint(`Diet order: ${tasks.map((task) => task.name).join(", ")}`);
  for (const task of tasks) task.perform();
}

function dailySpecialPrice(item: Item) {
  if (!hasMoonZoneRestaurant() || item !== get("_dailySpecial")) return 0;
  return get("_dailySpecialPrice");
}

MenuItem.defaultPriceFunction = (item: Item) => {
  const prices = [
    retrievePrice(item),
    mallPrice(item),
    npcPrice(item),
    dailySpecialPrice(item),
  ].filter((p) => p > 0 && p < Number.MAX_SAFE_INTEGER);
  if (prices.length > 0) {
    return Math.min(...prices);
  }
  return !item.tradeable && have(item) ? 0 : Infinity;
};

export function runDiet(): void {
  withVIPClan(() => {
    // Strip organ capacity enhancers to avoid accidental overfilling.
    if (myFamiliar() === $familiar`Stooper`) {
      useFamiliar($familiar.none);
    }

    for (const slot of Slot.all()) {
      const item = equippedItem(slot);
      if (
        numericModifier(item, $modifier`stomach capacity`) ||
        numericModifier(item, $modifier`liver capacity`) ||
        numericModifier(item, $modifier`spleen capacity`)
      ) {
        unequip(slot);
      }
    }

    // Compute diet
    const dietBuilder = computeDiet();

    if (globalOptions.simdiet) {
      print("===== SIMULATED DIET =====");
      if (!get("_mimeArmyShotglassUsed") && have($item`mime army shotglass`)) {
        printDiet(dietBuilder.shotglass(), "SHOTGLASS");
      }
      printDiet(dietBuilder.diet(), "FULL");
    } else {
      if (switchingToMayo()) {
        if (
          GarboWorkshed.current?.workshed ===
          $item`Asdon Martin keyfob (on ring)`
        ) {
          AsdonMartin.drive(
            FarmingStrategy.asdonEffect,
            dietAdventures(dietBuilder.diet()) +
              (globalOptions.ascend ? 0 : estimatedTurnsTomorrow),
          );
        } else {
          GarboWorkshed.current?.action?.();
        }

        if (GarboWorkshed.useNext()?.workshed !== $item`portable Mayo Clinic`) {
          throw new Error("Failed to switch to portable Mayo clinic");
        }
      }
      pillCheck();

      nonOrganAdventures();

      if (have($item`astral six-pack`)) {
        use($item`astral six-pack`);
      }
      if (!get("_mimeArmyShotglassUsed") && have($item`mime army shotglass`)) {
        consumeDiet(dietBuilder.shotglass(), "SHOTGLASS");
      }

      if (
        get("barrelShrineUnlocked") &&
        !get("_barrelPrayer") &&
        $classes`Turtle Tamer, Accordion Thief`.includes(myClass())
      ) {
        cliExecute("barrelprayer buff");
      }

      consumeDiet(dietBuilder.diet(), "FULL");
      const organChecks = [
        { current: myInebriety, max: inebrietyLimit },
        { current: mySpleenUse, max: spleenLimit },
        { current: myFullness, max: fullnessLimit },
      ];
      if (organChecks.some(({ current, max }) => current() < max())) {
        throw new Error("Tried to fill our organs but couldn't!");
      }
      shrugBadEffects();
    }
  });
  globalOptions.dietCompleted = true;
}

const PRE_DIET_WORKSHEDS = [
  undefined,
  ...$items`Asdon Martin keyfob (on ring), TakerSpace letter of Marque, spinning wheel`,
];
function switchingToMayo(): boolean {
  return (
    GarboWorkshed.next?.workshed === $item`portable Mayo Clinic` &&
    (PRE_DIET_WORKSHEDS.includes(GarboWorkshed.current?.workshed) ||
      !!GarboWorkshed.current?.canRemove())
  );
}

function dietAdventures(diet: Diet<Note>): number {
  return Math.floor(estimatedGarboTurns(false) + diet.expectedAdventures());
}
