import {
  autosellPrice,
  availableAmount,
  dailySpecial,
  fullnessLimit,
  getClanLounge,
  getIngredients,
  inebrietyLimit,
  Item,
  itemAmount,
  itemType,
  mallPrice,
  myFullness,
  myId,
  myInebriety,
  myLevel,
  sellsItem,
  toEffect,
  toInt,
  toItem,
} from "kolmafia";
import {
  $coinmaster,
  $effect,
  $item,
  $items,
  $skill,
  clamp,
  DesignerSweatpants,
  Diet,
  get,
  getAverageAdventures,
  getModifier,
  have,
  maxBy,
  MenuItem,
  notNull,
  realmAvailable,
  sum,
  sumNumbers,
} from "libram";
import { globalOptions } from "../config";
import { expectedGregs } from "../resources/extrovermectin";
import { shouldAugustCast } from "../resources/scepter";
import { MEAT_TARGET_MULTIPLIER, targetingMeat, targetMeat } from "../lib";
import { Potion } from "../potions";
import { garboValue } from "../garboValue";
import { GarboWorkshed } from "../tasks/post/worksheds";
import {
  existingNoodleCharges,
  frostyMug,
  hasMoonZoneRestaurant,
  legendaryNoodleDishes,
  Mayo,
  MPA,
  Note,
  saladFork,
  stomachLiverCleaners,
  switchingToMayo,
} from "./lib";

function noodleDishCharges(index: number): number {
  return index === 0 ? 3 : 2;
}

type NoodleDish = { dish: Item; price: number; owned: boolean };

const legendaryNoodles = $item`legendary noodles`;

function noodleDishPrice(dish: Item, ownNoodles: boolean): number {
  const cost = (item: Item) =>
    (ownNoodles || item !== legendaryNoodles) && have(item)
      ? ingredientCost(item)
      : mallPrice(item) || Infinity;
  const cookPrice = sumNumbers(
    Object.entries(getIngredients(dish)).map(
      ([name, quantity]) => quantity * cost(toItem(name)),
    ),
  );
  return Math.min(cookPrice, mallPrice(dish) || Infinity);
}

function bestNoodleDishToMake(ownNoodles: boolean): NoodleDish | null {
  const options = legendaryNoodleDishes
    .map((dish) => ({
      dish,
      price: noodleDishPrice(dish, ownNoodles),
      owned: false,
    }))
    .filter(({ price }) => Number.isFinite(price));
  if (options.length === 0) return null;
  return maxBy(
    options,
    ({ dish, price }) => getAverageAdventures(dish) * MPA - price,
  );
}

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
export function menu(): MenuItem<Note>[] {
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

export function countCopies(diet: Diet<Note>): number {
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

export function ingredientCost(item: Item): number {
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
 * @param plannedFoods foods the previous plan eats, which noodle dish charges can double
 */
export function potionMenu(
  baseMenu: MenuItem<Note>[],
  targets: number,
  turns: number,
  plannedFoods = new Map<Item, number>(),
): MenuItem<Note>[] {
  type PotionOptions = {
    price?: number;
    organ?: "spleen item" | "booze" | "food";
    size?: number;
  };
  // Food potions don't get added directly to the big menu array
  // we accumulate them here to put them into the noodlemenu.
  const foodPotions: {
    potion: Potion;
    limit?: number;
    options: PotionOptions;
    mayo?: Item;
  }[] = [];

  function potionTiers(
    potion: Potion,
    limit: number | undefined,
    options: PotionOptions,
    mayo: Item | undefined,
    noodleDoubled = false,
  ): MenuItem<Note>[] {
    if (limit === 0) return [];
    return potion.value(targets, turns, limit).map(
      (tier) =>
        new MenuItem<Note>(potion.potion, {
          maximum: tier.quantity,
          additionalValue: tier.value,
          priceOverride: options.price,
          organ: options.organ,
          size: options.size,
          data: noodleDoubled
            ? (`${tier.name} (noodle-doubled)` as const)
            : tier.name,
          mayo,
        }),
    );
  }

  function limitedPotion(
    input: Item | Potion,
    limit?: number,
    options: PotionOptions = {},
  ): MenuItem<Note>[] {
    if (limit === 0) {
      return [];
    }

    let potion = input instanceof Item ? new Potion(input) : input;
    if (itemType(potion.potion) !== "food") {
      return potionTiers(potion, limit, options, undefined);
    }
    let mayo: Item | undefined = undefined;
    if (
      GarboWorkshed.current?.workshed === $item`portable Mayo Clinic` ||
      switchingToMayo()
    ) {
      potion = potion.doubleDuration();
      mayo = Mayo.zapine;
    }
    foodPotions.push({ potion, limit, options, mayo });
    return [];
  }

  function noodleMenu(): MenuItem<Note>[] {
    const existing = existingNoodleCharges();

    const bestValue = (potion: Potion) =>
      potion.value(targets, turns, 1)[0]?.value ?? 0;

    // Determine the highest-value food potions to double.
    const ranked = foodPotions
      .map((foodPotion) => {
        const doubled = bestValue(foodPotion.potion.doubleDuration());
        const price = foodPotion.options.price ?? foodPotion.potion.price();
        return {
          foodPotion,
          gain: doubled > price ? doubled - bestValue(foodPotion.potion) : -1,
        };
      })
      .filter(({ gain }) => gain > 0)
      .sort((a, b) => b.gain - a.gain);
    const charges: typeof ranked = [];

    const assignCharges = (
      count: number,
      available: (entry: (typeof ranked)[number]) => number,
    ) => {
      const end = charges.length + count;
      for (const entry of ranked) {
        const assigned = charges.filter((charge) => charge === entry).length;
        const uses = Math.min(
          available(entry) - assigned,
          end - charges.length,
        );
        for (let i = 0; i < uses; i++) charges.push(entry);
      }
    };

    assignCharges(existing, (entry) => entry.foodPotion.limit ?? Infinity);

    // A single item might map to multiple foodPotion entries, each with their own limits;
    // distribute the planned consumption to not exceed any limits.
    const unclaimed = new Map(plannedFoods);
    const plannedUses = new Map(
      ranked.map((entry) => {
        const item = entry.foodPotion.potion.potion;
        const uses = Math.min(
          entry.foodPotion.limit ?? Infinity,
          unclaimed.get(item) ?? 0,
        );
        unclaimed.set(item, (unclaimed.get(item) ?? 0) - uses);
        return [entry, uses];
      }),
    );

    // Enough dishes to double every planned eat, beyond the ones we own
    const plannedCharges = sumNumbers([...plannedUses.values()]);
    const dishes = [
      ...legendaryNoodleDishes.flatMap((dish) =>
        new Array<NoodleDish>(availableAmount(dish)).fill({
          dish,
          price: MenuItem.defaultPriceFunction(dish),
          owned: true,
        }),
      ),
      // If noodles are mallmin, we value ones you own cheaper than ones you buy.
      // Double up on entries to account for both.
      ...new Array<NoodleDish | null>(availableAmount(legendaryNoodles)).fill(
        bestNoodleDishToMake(true),
      ),
      ...new Array<NoodleDish | null>(Math.ceil(plannedCharges / 2)).fill(
        bestNoodleDishToMake(false),
      ),
    ]
      .filter(notNull)
      .sort((a, b) => a.price - b.price);

    const totalCharges =
      existing + sumNumbers(dishes.map((_, index) => noodleDishCharges(index)));

    // Value charges from eating pasta against foods in the previous plan,
    // so pasta doesn't get credit for doubling food we don't expect to eat.
    assignCharges(
      totalCharges - existing,
      (entry) => plannedUses.get(entry) ?? 0,
    );

    // Add the value of existing noodle charges directly to food potions, because there's no noodle dish to claim it.
    const potionItems = foodPotions.flatMap((foodPotion) => {
      const { potion, limit, options, mayo } = foodPotion;
      const doubledUses = charges
        .slice(0, existing)
        .filter((charge) => charge.foodPotion === foodPotion).length;
      if (doubledUses === 0) return potionTiers(potion, limit, options, mayo);
      return [
        ...potionTiers(
          potion.doubleDuration(),
          doubledUses,
          options,
          mayo,
          true,
        ),
        ...potionTiers(
          potion,
          limit === undefined ? undefined : limit - doubledUses,
          options,
          mayo,
        ),
      ];
    });

    let used = existing;
    // The planner can't make a food's doubling conditional on eating pasta, so credit
    // that benefit to the pasta instead. Unassigned charges contribute nothing.
    const dishItems = dishes.flatMap(({ dish, price, owned }, index) => {
      const dishCharges = charges.slice(used, used + noodleDishCharges(index));
      used += noodleDishCharges(index);
      const additionalValue = sum(dishCharges, "gain");
      if (!owned && additionalValue <= 0) return [];
      return new MenuItem<Note>(dish, {
        maximum: 1,
        additionalValue,
        priceOverride: price,
      });
    });

    return [...potionItems, ...dishItems];
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

  const menuItems = [
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
  return [...menuItems, ...noodleMenu()];
}
