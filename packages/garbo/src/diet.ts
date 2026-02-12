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
  npcPrice,
  print,
  putCloset,
  retrieveItem,
  retrievePrice,
  sellsItem,
  setProperty,
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
  $skill,
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
  withProperties,
} from "libram";
import { acquire, priceCaps } from "./acquire";
import { withVIPClan } from "./clan";
import { globalOptions } from "./config";
import {
  beretEffectValue,
  expectedGregs,
  shouldAugustCast,
  synthesize,
} from "./resources";
import {
  arrayEquals,
  HIGHLIGHT,
  MEAT_TARGET_MULTIPLIER,
  requiredOvercapEquipment,
  targetingMeat,
  targetMeat,
  userConfirmDialog,
} from "./lib";
import { shrugBadEffects } from "./mood";
import { Potion, PotionTier } from "./potions";
import { estimatedGarboTurns, highMeatMonsterCount } from "./turns";
import { garboValue } from "./garboValue";
import { Outfit } from "grimoire-kolmafia";

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
      autoSatisfyWithMall: !usingMoonZoneRestaurant,
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
  useIfUnused($item`milk of magnesium`, "_milkOfMagnesiumUsed", 5 * MPA);
  consumeWhileRespectingMoonRestaurant(() => {
    if (!eat(qty, item)) throw "Failed to eat safely";
  }, item);
}

const EXPENSIVE_SONGS = $effects`The Ballad of Richie Thingfinder, Chorale of Companionship`;
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
  return beretEffectValue(effect, duration);
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
  if (!chew(qty, item)) throw "Failed to chew safely";
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
      acquire(qty, item, cap, true);
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
export function potionMenu(
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
    if (itemType(potion.potion) === "food" && MayoClinic.installed()) {
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
function balanceMenu(
  baseMenu: MenuItem<Note>[],
  dietPlanner: DietPlanner,
): MenuItem<Note>[] {
  const baseTargets = highMeatMonsterCount();
  function rebalance(
    menu: MenuItem<Note>[],
    iterations: number,
    targets: number,
    adventures: number,
  ): MenuItem<Note>[] {
    const fullMenu = potionMenu(
      menu,
      baseTargets + targets,
      estimatedGarboTurns(false) + adventures,
    );
    if (iterations <= 0) {
      return fullMenu;
    } else {
      const balancingDiet = dietPlanner(fullMenu);
      return rebalance(
        menu,
        iterations - 1,
        countCopies(balancingDiet),
        balancingDiet.expectedAdventures(),
      );
    }
  }
  const baseDiet = dietPlanner(baseMenu);
  return rebalance(baseMenu, 5, 0, baseDiet.expectedAdventures());
}

export function computeDiet(): {
  diet: () => Diet<Note>;
  shotglass: () => Diet<Note>;
  pantsgiving: () => Diet<Note>;
  sweatpants: () => Diet<Note>;
} {
  print("Calculating diet, please wait...", HIGHLIGHT);
  // Handle spleen manually, as the diet planner doesn't support synth. Only fill food and booze.

  const orEmpty = (diet: Diet<Note>) =>
    diet.expectedValue(MPA, "net") < 0 ? new Diet<Note>() : diet;
  const fullDietPlanner = (menu: MenuItem<Note>[]) =>
    orEmpty(Diet.plan(MPA, menu));
  const shotglassDietPlanner = (menu: MenuItem<Note>[]) =>
    orEmpty(Diet.plan(MPA, menu, { booze: 1 }));
  const pantsgivingDietPlanner = (menu: MenuItem<Note>[]) =>
    orEmpty(Diet.plan(MPA, menu, { food: 1 }));
  const sweatpantsDietPlanner = (menu: MenuItem<Note>[]) =>
    orEmpty(Diet.plan(MPA, menu, { booze: getRemainingLiver() }));
  // const shotglassFilter = (menuItem: MenuItem)

  return {
    diet: () =>
      fullDietPlanner(
        balanceMenu(
          menu().filter(
            (menuItem) =>
              !priceCaps[menuItem.item.name] ||
              priceCaps[menuItem.item.name] >= mallPrice(menuItem.item),
          ),
          fullDietPlanner,
        ),
      ),
    shotglass: () =>
      shotglassDietPlanner(
        balanceMenu(
          menu().filter(
            (menuItem) =>
              itemType(menuItem.item) === "booze" && menuItem.size === 1,
          ),
          shotglassDietPlanner,
        ),
      ),
    pantsgiving: () =>
      pantsgivingDietPlanner(
        balanceMenu(
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
      ),
    sweatpants: () =>
      sweatpantsDietPlanner(
        balanceMenu(
          menu().filter(
            (menuItem) =>
              itemType(menuItem.item) === "booze" && menuItem.size <= 3,
          ),
          sweatpantsDietPlanner,
        ),
      ),
  };
}

type DietName =
  | "FULL"
  | "SHOTGLASS"
  | "PANTSGIVING"
  | "REMAINING"
  | "SWEATPANTS";

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

export function consumeDiet(diet: Diet<Note>, name: DietName): void {
  if (diet.entries.length === 0) return;
  diet = diet.copy();
  diet.entries.sort(
    (a, b) => itemPriority(b.menuItems) - itemPriority(a.menuItems),
  );

  print();
  printDiet(diet, name);
  print();

  const seasoningCount = sum(diet.entries, ({ menuItems, quantity }) =>
    menuItems.some((menuItem) => menuItem.item === $item`Special Seasoning`)
      ? quantity
      : 0,
  );
  acquire(seasoningCount, $item`Special Seasoning`, MPA);

  // Fill organs in rounds, making sure we're making progress in each round.
  const organs = () => [myFullness(), myInebriety(), mySpleenUse()];
  let lastOrgans = [-1, -1, -1];
  const capacities = () => [fullnessLimit(), inebrietyLimit(), spleenLimit()];
  let lastCapacities = [-1, -1, -1];
  let currentQuantity = sum(diet.entries, "quantity");
  let lastQuantity = -1;
  while (currentQuantity > 0) {
    if (
      arrayEquals(lastOrgans, organs()) &&
      arrayEquals(lastCapacities, capacities()) &&
      lastQuantity === currentQuantity
    ) {
      print();
      printDiet(diet, "REMAINING");
      print();
      throw "Failed to consume some diet item.";
    }
    lastOrgans = organs();
    lastCapacities = capacities();
    lastQuantity = currentQuantity;

    for (const dietEntry of diet.entries) {
      const { menuItems, quantity } = dietEntry;
      if (quantity === 0) continue;

      let countToConsume = quantity;

      const capacity = {
        food: fullnessLimit() - myFullness(),
        booze: inebrietyLimit() - myInebriety(),
        "spleen item": spleenLimit() - mySpleenUse(),
      };
      for (const menuItem of menuItems) {
        logprint(`Considering item ${menuItem.item}.`);
        if (
          menuItem.organ === "booze" &&
          menuItem.size === 1 &&
          !get("_mimeArmyShotglassUsed")
        ) {
          countToConsume = 1;
        } else if (menuItem.organ && menuItem.size > 0) {
          countToConsume = Math.min(
            countToConsume,
            Math.floor(capacity[menuItem.organ] / menuItem.size),
          );
        }
        logprint(`Based on organ size, planning to consume ${countToConsume}.`);

        const cleaning = stomachLiverCleaners.get(menuItem.item);
        if (cleaning) {
          const [fullness, inebriety] = cleaning;
          countToConsume = Math.min(
            fullness < 0 ? Math.floor(-myFullness() / fullness) : quantity,
            inebriety < 0 ? Math.floor(-myInebriety() / inebriety) : quantity,
            countToConsume,
          );
          logprint(
            `Based on organ-cleaning, planning to consume ${countToConsume}.`,
          );
        }

        const spleenCleaned = spleenCleaners.get(menuItem.item);
        if (spleenCleaned) {
          countToConsume = Math.min(
            countToConsume,
            Math.floor(mySpleenUse() / spleenCleaned),
          );
          logprint(
            `Based on organ-cleaning, planning to consume ${countToConsume}.`,
          );
        }
      }

      if (countToConsume === 0) continue;

      type ItemAction = (
        countToConsume: number,
        menuItem: MenuItem<Note>,
      ) => void;
      const elementalResistAction = (element: Element): ItemAction => {
        return (countToConsume: number, menuItem: MenuItem<Note>) => {
          if (myMaxhp() < 1000 * (1 - elementalResistance(element) / 100)) {
            maximizeCached(["0.05 HP", `${element} Resistance`]);
            if (myMaxhp() < 1000 * (1 - elementalResistance(element) / 100)) {
              throw `Could not achieve enough ${element} resistance for ${menuItem.item}.`;
            }
          }
          consumeSafe(countToConsume, menuItem.item);
        };
      };

      const speakeasyDrinks: [Item, ItemAction][] = Object.keys(getClanLounge())
        .map((s) => toItem(s))
        .filter((i) => i.inebriety > 0)
        .map((drink) => [
          drink,
          (countToConsume: number, menuItem: MenuItem<Note>) => {
            cliExecute(`drink ${countToConsume} ${menuItem.item}`);
          },
        ]);
      const mayoActions: [Item, ItemAction][] = Object.values(Mayo).map((i) => [
        i,
        (countToConsume: number, menuItem: MenuItem<Note>) => {
          MayoClinic.setMayoMinder(menuItem.item, countToConsume);
        },
      ]);

      const itemActions = new Map<Item, ItemAction | "skip">([
        [saladFork, elementalResistAction($element`hot`)],
        [frostyMug, elementalResistAction($element`cold`)],
        [
          $item`pocket wish`,
          (countToConsume: number, menuItem: MenuItem<Note>) =>
            acquire(countToConsume, $item`pocket wish`, 60000) &&
            cliExecute(`genie effect ${menuItem.effect}`),
        ],
        [
          $item`campfire hot dog`,
          (countToConsume: number, menuItem: MenuItem<Note>) => {
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
        [$item`Special Seasoning`, "skip"],
        [
          $item`mini kiwi aioli`,
          (countToConsume: number, menuItem: MenuItem<Note>) => {
            retrieveItem(menuItem.item, countToConsume);
            use(menuItem.item);
          },
        ],
        [
          $item`Rethinking Candy`,
          (countToConsume: number, menuItem: MenuItem<Note>) =>
            synthesize(
              countToConsume,
              menuItem.effect ?? $effect`Synthesis: Greed`,
            ),
        ],
        ...mayoActions,
        ...speakeasyDrinks,
        [
          $item`broberry brogurt`,
          (countToConsume: number, menuItem: MenuItem<Note>) => {
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
            consumeSafe(
              countToConsume,
              menuItem.item,
              menuItem.additionalValue,
            );
          },
        ],
        [
          $item`designer sweatpants`,
          (countToConsume: number) => {
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

      for (const menuItem of menuItems) {
        const itemAction = itemActions.get(menuItem.item);
        if (itemAction === "skip") {
          continue;
        } else if (itemAction) {
          itemAction(countToConsume, menuItem);
        } else {
          consumeSafe(countToConsume, menuItem.item, menuItem.additionalValue);
        }
      }
      dietEntry.quantity -= countToConsume;
    }
    currentQuantity = sum(diet.entries, "quantity");
  }
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
    if (myFamiliar() === $familiar`Stooper`) {
      useFamiliar($familiar.none);
    }

    const dietBuilder = computeDiet();

    if (globalOptions.simdiet) {
      print("===== SIMULATED DIET =====");
      if (!get("_mimeArmyShotglassUsed") && have($item`mime army shotglass`)) {
        printDiet(dietBuilder.shotglass(), "SHOTGLASS");
      }
      printDiet(dietBuilder.diet(), "FULL");
    } else {
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

      if (globalOptions.overcapped) {
        Outfit.from({ equip: requiredOvercapEquipment })?.dress();
      }

      consumeDiet(dietBuilder.diet(), "FULL");

      shrugBadEffects();
    }
  });
  globalOptions.dietCompleted = true;
}
