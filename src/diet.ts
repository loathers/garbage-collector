import {
  availableAmount,
  chew,
  cliExecute,
  drink,
  eat,
  elementalResistance,
  fullnessLimit,
  getIngredients,
  getProperty,
  haveEffect,
  inebrietyLimit,
  itemType,
  mallPrice,
  myClass,
  myFamiliar,
  myFullness,
  myInebriety,
  myLevel,
  myMaxhp,
  mySpleenUse,
  print,
  setProperty,
  spleenLimit,
  turnsPerCast,
  use,
  useFamiliar,
  userConfirm,
  useSkill,
  wait,
} from "kolmafia";
import {
  $class,
  $classes,
  $effect,
  $element,
  $familiar,
  $item,
  $items,
  $monster,
  $skill,
  clamp,
  Diet,
  get,
  getAverageAdventures,
  getSaleValue,
  have,
  Kmail,
  maximizeCached,
  MayoClinic,
  MenuItem,
  set,
  sum,
} from "libram";
import { acquire } from "./acquire";
import { embezzlerCount, estimatedTurns } from "./embezzler";
import { expectedGregs } from "./extrovermectin";
import { arrayEquals, globalOptions } from "./lib";
import { Potion } from "./potions";
import synthesize from "./synthesis";

const MPA = get("valueOfAdventure");
print(`Using adventure value ${MPA}.`, "blue");

const Mayo = MayoClinic.Mayo;

function eatSafe(qty: number, item: Item) {
  if (have($item`Universal Seasoning`) && !get("_universalSeasoningUsed")) {
    use($item`Universal Seasoning`);
  }
  if (myLevel() >= 15 && !get("_hungerSauceUsed") && mallPrice($item`Hunger™ Sauce`) < 3 * MPA) {
    acquire(1, $item`Hunger™ Sauce`, 3 * MPA);
    use($item`Hunger™ Sauce`);
  }
  if (mallPrice($item`fudge spork`) < 3 * MPA && !get("_fudgeSporkUsed")) {
    eat($item`fudge spork`);
  }
  useIfUnused($item`milk of magnesium`, "_milkOfMagnesiumUsed", 5 * MPA);

  if (!eat(qty, item)) throw "Failed to eat safely";
}

function drinkSafe(qty: number, item: Item) {
  const prevDrunk = myInebriety();
  if (have($skill`The Ode to Booze`)) {
    const odeTurns = qty * item.inebriety;
    const castTurns = odeTurns - haveEffect($effect`Ode to Booze`);
    if (castTurns > 0) {
      useSkill(
        $skill`The Ode to Booze`,
        Math.ceil(castTurns / turnsPerCast($skill`The Ode to Booze`))
      );
    }
  }
  if (!drink(qty, item)) throw "Failed to drink safely";
  if (item.inebriety === 1 && prevDrunk === qty + myInebriety() - 1) {
    // sometimes mafia does not track the mime army shotglass property
    setProperty("_mimeArmyShotglassUsed", "true");
  }
}

function chewSafe(qty: number, item: Item) {
  if (!chew(qty, item)) throw "Failed to chew safely";
}

function consumeSafe(qty: number, item: Item, additionalValue?: number) {
  if (spleenCleaners.includes(item) && mySpleenUse() < 5) {
    throw "No spleen to clear with this.";
  }
  const averageAdventures = getAverageAdventures(item);
  if (averageAdventures > 0 || additionalValue) {
    const cap = Math.max(0, averageAdventures * MPA) + (additionalValue ?? 0);
    acquire(qty, item, cap);
  } else {
    acquire(qty, item);
  }
  if (itemType(item) === "food") eatSafe(qty, item);
  else if (itemType(item) === "booze") drinkSafe(qty, item);
  else if (itemType(item) === "spleen item") chewSafe(qty, item);
  else use(qty, item);
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
      print(`Skipping ${item.name}; too expensive (${mallPrice(item)} > ${maxPrice}).`);
    }
  }
}

function nonOrganAdventures(): void {
  useIfUnused($item`fancy chocolate car`, get("_chocolatesUsed") === 0, 2 * MPA);

  while (get("_loveChocolatesUsed") < 3) {
    const price = have($item`LOV Extraterrestrial Chocolate`) ? 15000 : 20000;
    const value = clamp(3 - get("_loveChocolatesUsed"), 0, 3) * get("valueOfAdventure");
    if (value < price) break;
    if (!have($item`LOV Extraterrestrial Chocolate`)) {
      Kmail.send("sellbot", `${$item`LOV Extraterrestrial Chocolate`.name} (1)`, undefined, 20000);
      wait(11);
      cliExecute("refresh inventory");
      if (!have($item`LOV Extraterrestrial Chocolate`)) {
        print("I'm tired of waiting for sellbot to send me some chocolate", "red");
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
    const chocoVals = Array.from(chocos.values()).map((choc) => {
      return {
        choco: choc,
        value: chocExpVal(i, choc),
      };
    });
    const best = chocoVals.sort((a, b) => b.value - a.value)[0];
    acquire(1, best.choco, best.value + mallPrice(best.choco), false);
    if (best.value > 0) use(1, best.choco);
    else break;
  }

  useIfUnused(
    $item`fancy chocolate sculpture`,
    get("_chocolateSculpturesUsed") < 1,
    5 * MPA + 5000
  );
  useIfUnused($item`essential tofu`, "_essentialTofuUsed", 5 * MPA);

  if (!get("_etchedHourglassUsed") && have($item`etched hourglass`)) {
    use(1, $item`etched hourglass`);
  }

  if (getProperty("_timesArrowUsed") !== "true" && mallPrice($item`time's arrow`) < 5 * MPA) {
    acquire(1, $item`time's arrow`, 5 * MPA);
    cliExecute("csend 1 time's arrow to botticelli");
    setProperty("_timesArrowUsed", "true");
  }

  if (have($skill`Ancestral Recall`) && mallPrice($item`blue mana`) < 3 * MPA) {
    const casts = Math.max(10 - get("_ancestralRecallCasts"), 0);
    acquire(casts, $item`blue mana`, 3 * MPA);
    useSkill(casts, $skill`Ancestral Recall`);
  }

  if (globalOptions.ascending) useIfUnused($item`borrowed time`, "_borrowedTimeUsed", 5 * MPA);
}

function pillCheck(): void {
  if (!get("_distentionPillUsed")) {
    if (!get<boolean>("garbo_skipPillCheck", false) && !have($item`distention pill`, 1)) {
      set(
        "garbo_skipPillCheck",
        userConfirm(
          "You do not have any distention pills. Continue anyway? (Defaulting to no in 15 seconds)",
          15000,
          false
        )
      );
    }
  }

  if (!get("_syntheticDogHairPillUsed")) {
    if (!get<boolean>("garbo_skipPillCheck", false) && !have($item`synthetic dog hair pill`, 1)) {
      set(
        "garbo_skipPillCheck",
        userConfirm(
          "You do not have any synthetic dog hair pills. Continue anyway? (Defaulting to no in 15 seconds)",
          15000,
          false
        )
      );
    }
  }
}

const saladFork = $item`Ol' Scratch's salad fork`;
const frostyMug = $item`Frosty's frosty mug`;
const spleenCleaners = $items`extra-greasy slider, jar of fermented pickle juice`;
const stomachLiverCleaners = new Map([
  [$item`spice melange`, [-3, -3]],
  [$item`synthetic dog hair pill`, [0, -1]],
  [$item`cuppa Sobrie tea`, [0, -1]],
]);

/**
 * Generate a basic menu of high-yield items to consider
 * @returns basic menu
 */
function menu(): MenuItem<string>[] {
  const spaghettiBreakfast =
    have($item`spaghetti breakfast`) &&
    myFullness() === 0 &&
    get("_timeSpinnerFoodAvailable") === "" &&
    !get("_spaghettiBreakfastEaten")
      ? 1
      : 0;

  return [
    // FOOD
    new MenuItem<string>($item`Dreadsylvanian spooky pocket`),
    new MenuItem<string>($item`tin cup of mulligan stew`),
    new MenuItem<string>($item`glass of raw eggs`, {
      maximum: availableAmount($item`glass of raw eggs`),
    }),
    new MenuItem<string>($item`Tea, Earl Grey, Hot`),
    new MenuItem<string>($item`meteoreo`),
    new MenuItem<string>($item`ice rice`),
    new MenuItem<string>($item`frozen banquet`),
    new MenuItem<string>($item`fishy fish lasagna`),
    new MenuItem<string>($item`gnat lasagna`),
    new MenuItem<string>($item`long pork lasagna`),
    new MenuItem<string>($item`spaghetti breakfast`, { maximum: spaghettiBreakfast }),

    // BOOZE
    new MenuItem<string>($item`elemental caipiroska`),
    new MenuItem<string>($item`Dreadsylvanian grimlet`),
    new MenuItem<string>($item`Hodgman's blanket`),
    new MenuItem<string>($item`Sacramento wine`),
    new MenuItem<string>($item`iced plum wine`),
    new MenuItem<string>($item`splendid martini`),
    new MenuItem<string>($item`Eye and a Twist`),
    new MenuItem<string>($item`punch-drunk punch`, {
      maximum: availableAmount($item`punch-drunk punch`),
    }),
    new MenuItem<string>($item`blood-red mushroom wine`),
    new MenuItem<string>($item`buzzing mushroom wine`),
    new MenuItem<string>($item`complex mushroom wine`),
    new MenuItem<string>($item`overpowering mushroom wine`),
    new MenuItem<string>($item`smooth mushroom wine`),
    new MenuItem<string>($item`swirling mushroom wine`),
    new MenuItem<string>($item`astral pilsner`, {
      maximum: globalOptions.ascending ? availableAmount($item`astral pilsner`) : 0,
    }),
    ...Item.all()
      .filter((item) => getIngredients(item)["perfect ice cube"])
      .map((item) => new MenuItem<string>(item)),

    // SPLEEN
    new MenuItem<string>($item`octolus oculus`),
    new MenuItem<string>($item`cute mushroom`),
    new MenuItem<string>($item`prismatic wad`),
    new MenuItem<string>($item`transdermal smoke patch`),
    new MenuItem<string>($item`antimatter wad`),
    new MenuItem<string>($item`voodoo snuff`),
    new MenuItem<string>($item`blood-drive sticker`),

    // HELPERS
    ...spleenCleaners.map((item) => new MenuItem<string>(item)),
    ...[...stomachLiverCleaners.keys()].map((item) => new MenuItem<string>(item)),
    new MenuItem<string>($item`distention pill`),
    new MenuItem<string>($item`cuppa Voraci tea`),
    new MenuItem<string>(Mayo.flex),
    new MenuItem<string>(Mayo.zapine),
    new MenuItem<string>($item`Special Seasoning`),
    new MenuItem<string>(saladFork),
    new MenuItem<string>(frostyMug),
    new MenuItem<string>($item`mojo filter`),
    new MenuItem<string>($item`pocket wish`, { maximum: 1, effect: $effect`Refined Palate` }),
    new MenuItem<string>($item`toasted brie`, { maximum: 1 }),
    new MenuItem<string>($item`potion of the field gar`, { maximum: 1 }),
  ];
}

function copiers() {
  const embezzlerDifferential = 25000 - 7500;
  // const normalGregs = have($item`miniature crystal ball`) ? 4 : 3;
  const alreadyGregarious =
    get("beGregariousCharges") > 0 ||
    (get("beGregariousFightsLeft") > 0 &&
      get("beGregariousMonster") === $monster`Knob Goblin Embezzler`);

  return [
    new MenuItem<string>($item`Extrovermectin™`, {
      additionalValue: expectedGregs() * embezzlerDifferential,
      maximum: alreadyGregarious ? 0 : 1,
      data: "first gregarious",
    }),
    /*new MenuItem<string>($item`Extrovermectin™`, {
      additionalValue: normalGregs * embezzlerDifferential,
      data: "additional gregarious",
    }),
    new MenuItem<string>($item`Eight Days a Week Pill Keeper`, {
      additionalValue: embezzlerDifferential,
      organ: "spleen item",
      maximum: canAdv($location`Cobb's Knob Treasury`, true) ? undefined : 0,
      size: 3,
      data: "semirare",
    }),*/
  ];
}

function countCopies(diet: Diet<string>) {
  // const normalGregs = have($item`miniature crystal ball`) ? 4 : 3;
  const firstGregarious = diet.entries.some((dietEntry) =>
    dietEntry.menuItems.some(
      (menuItem) => menuItem.item === $item`Extrovermectin™` && menuItem.data === "first gregarious"
    )
  );

  return (firstGregarious ? 1 : 0) * expectedGregs();
}

/**
 * Generate a potion diet that has entries
 * @param embezzlers number of embezzlers expected to be encountered on this day
 * @param turns number of turns total expecte
 */
export function potionMenu(
  baseMenu: MenuItem<string>[],
  embezzlers: number,
  turns: number
): MenuItem<string>[] {
  function limitedPotion(
    input: Item | Potion,
    limit?: number,
    options: { price?: number; organ?: "spleen item" | "booze" | "food"; size?: number } = {}
  ) {
    if (limit === 0) {
      return [];
    }

    let potion = input instanceof Item ? new Potion(input) : input;
    let mayo: Item | undefined = undefined;
    if (itemType(potion.potion) === "food" && MayoClinic.installed()) {
      potion = potion.doubleDuration();
      mayo = Mayo.zapine;
    }
    return potion.value(embezzlers, turns, limit).map(
      (tier) =>
        new MenuItem<string>(potion.potion, {
          maximum: tier.quantity,
          additionalValue: tier.value,
          priceOverride: options.price,
          organ: options.organ,
          size: options.size,
          data: tier.name,
          mayo,
        })
    );
  }
  function potion(potion: Item | Potion, options = {}) {
    return limitedPotion(potion, undefined, options);
  }

  return [
    ...baseMenu,
    ...copiers(),

    // FOOD POTIONS
    ...potion($item`jumping horseradish`),
    ...potion($item`tempura cauliflower`),
    ...potion($item`sea truffle`),
    ...potion($item`tempura broccoli`),
    ...limitedPotion(
      $item`Dinsey food-cone`,
      get("_stenchAirportToday") || get("stenchAirportAlways")
        ? availableAmount($item`FunFunds™`) / 2
        : 0,
      { price: (2 * getSaleValue($item`one-day ticket to Dinseylandfill`)) / 20 }
    ),

    // BOOZE POTIONS
    ...potion($item`dirt julep`),
    ...potion($item`Ambitious Turkey`),
    ...potion($item`Friendly Turkey`),
    ...potion($item`vintage smart drink`),
    ...limitedPotion($item`Hot Socks`, 3, { price: 5000 }),

    // SPLEEN POTIONS
    ...potion($item`beggin' cologne`),
    ...limitedPotion($item`body spradium`, availableAmount($item`body spradium`)),
    ...potion($item`Knob Goblin pet-buffing spray`),
    ...potion($item`Knob Goblin nasal spray`),
    ...potion(
      new Potion($item`Rethinking Candy`, {
        effect: $effect`Synthesis: Greed`,
        duration: 30,
      }),
      {
        size: 1,
        organ: "spleen item",
        price: 0,
      }
    ),
  ];
}

interface DietPlanner {
  (menu: MenuItem<string>[]): Diet<string>;
}
function balanceMenu(baseMenu: MenuItem<string>[], dietPlanner: DietPlanner): MenuItem<string>[] {
  const baseEmbezzlers = embezzlerCount();
  function rebalance(
    menu: MenuItem<string>[],
    iterations: number,
    embezzlers: number,
    adventures: number
  ): MenuItem<string>[] {
    const fullMenu = potionMenu(menu, baseEmbezzlers + embezzlers, estimatedTurns() + adventures);
    if (iterations <= 0) {
      return fullMenu;
    } else {
      const balancingDiet = dietPlanner(fullMenu);
      return rebalance(
        menu,
        iterations - 1,
        countCopies(balancingDiet),
        balancingDiet.expectedAdventures()
      );
    }
  }
  const baseDiet = dietPlanner(baseMenu);
  return rebalance(baseMenu, 5, 0, baseDiet.expectedAdventures());
}

export function computeDiet(): {
  diet: () => Diet<string>;
  shotglass: () => Diet<string>;
  pantsgiving: () => Diet<string>;
} {
  // Handle spleen manually, as the diet planner doesn't support synth. Only fill food and booze.

  const fullDietPlanner = (menu: MenuItem<string>[]) => Diet.plan(MPA, menu);
  const shotglassDietPlanner = (menu: MenuItem<string>[]) => Diet.plan(MPA, menu, { booze: 1 });
  const pantsgivingDietPlanner = (menu: MenuItem<string>[]) => Diet.plan(MPA, menu, { food: 1 });
  // const shotglassFilter = (menuItem: MenuItem)

  return {
    diet: () => fullDietPlanner(balanceMenu(menu(), fullDietPlanner)),
    shotglass: () =>
      shotglassDietPlanner(
        balanceMenu(
          menu().filter((menuItem) => itemType(menuItem.item) === "booze" && menuItem.size === 1),
          shotglassDietPlanner
        )
      ),
    pantsgiving: () =>
      pantsgivingDietPlanner(
        balanceMenu(
          menu().filter((menuItem) => itemType(menuItem.item) === "food" && menuItem.size === 1),
          pantsgivingDietPlanner
        )
      ),
  };
}

function printDiet(diet: Diet<string>) {
  const embezzlers = Math.floor(embezzlerCount() + countCopies(diet));
  const adventures = Math.floor(estimatedTurns() + diet.expectedAdventures());
  print(`Planning to fight ${embezzlers} embezzlers and run ${adventures} adventures`);

  for (const dietEntry of diet.entries) {
    if (dietEntry.quantity === 0) continue;
    const target = dietEntry.target();
    const datastr = target.data ? `(${target.data})` : "";
    const maxstr = target.maximum ? ` (max ${target.maximum})` : "";
    const helpersstr =
      dietEntry.helpers().length > 0 ? ` helpers: ${dietEntry.helpers().join(", ")}` : "";
    const addvalstr = target.additionalValue
      ? ` (additional value: ${target.additionalValue})`
      : "";
    const valuestr = `value: ${Math.floor(
      dietEntry.expectedValue(MPA, diet)
    )}${addvalstr} price: ${Math.floor(dietEntry.expectedPrice())}`;
    print(`${dietEntry.quantity}${maxstr} ${target}${datastr}${helpersstr} ${valuestr}`);
  }
  const totalValue = diet.expectedValue(MPA);
  const totalCost = diet.expectedPrice();
  const netValue = totalValue - totalCost;
  print(
    `Assuming MPA of ${MPA}. Total Cost: ${totalCost}, Total Value ${totalValue}, Net Value ${netValue}`
  );
}

// Item priority - higher means we eat it first.
// Anything that gives a consumption buff should go first (e.g. Refined Palate).
function itemPriority(menuItems: MenuItem<string>[]) {
  // Last menu item is the food itself.
  const menuItem = menuItems[menuItems.length - 1];
  if (menuItem === undefined) {
    throw "Shouldn't have an empty menu item.";
  }
  if ($items`pocket wish, toasted brie`.includes(menuItem.item)) {
    return 100;
  } else {
    return 0;
  }
}

export function consumeDiet(diet: Diet<string>): void {
  diet = diet.copy();
  print();
  print("===== PLANNED DIET =====");
  printDiet(diet);
  print();

  diet.entries.sort((a, b) => itemPriority(b.menuItems) - itemPriority(a.menuItems));

  const seasoningCount = sum(diet.entries, ({ menuItems, quantity }) =>
    menuItems.some((menuItem) => menuItem.item === $item`Special Seasoning`) ? quantity : 0
  );
  acquire(seasoningCount, $item`Special Seasoning`, MPA);

  // Fill organs in rounds, making sure we're making progress in each round.
  const organs = () => [myFullness(), myInebriety(), mySpleenUse()];
  let lastOrgans = [-1, -1, -1];
  while (sum(diet.entries, ({ quantity }) => quantity) > 0) {
    if (arrayEquals(lastOrgans, organs())) {
      print();
      print("==== REMAINING DIET BEFORE ERROR ====");
      printDiet(diet);
      print();
      throw "Failed to consume some diet item.";
    }
    lastOrgans = organs();

    for (const dietEntry of diet.entries) {
      const { menuItems, quantity } = dietEntry;
      if (quantity === 0) continue;

      let countToConsume = quantity;
      if (menuItems.some((menuItem) => spleenCleaners.includes(menuItem.item))) {
        countToConsume = Math.min(countToConsume, Math.floor(mySpleenUse() / 5));
      }

      const capacity = {
        food: fullnessLimit() - myFullness(),
        booze: inebrietyLimit() - myInebriety(),
        "spleen item": spleenLimit() - mySpleenUse(),
      };
      for (const menuItem of menuItems) {
        if (menuItem.organ && menuItem.size > 0) {
          countToConsume = Math.min(
            countToConsume,
            Math.floor(capacity[menuItem.organ] / menuItem.size)
          );
        }

        const cleaning = stomachLiverCleaners.get(menuItem.item);
        if (cleaning) {
          const [fullness, inebriety] = cleaning;
          if (myFullness() + fullness < 0 || myInebriety() + inebriety < 0) {
            countToConsume = 0;
          }
        }
      }

      if (countToConsume === 0) continue;

      for (const menuItem of menuItems) {
        if ([saladFork, frostyMug].includes(menuItem.item)) {
          const element = menuItem.item === saladFork ? $element`hot` : $element`cold`;
          if (myMaxhp() < 1000 * (1 - elementalResistance(element) / 100)) {
            maximizeCached(["0.05 HP", `${element} Resistance`]);
            if (myMaxhp() < 1000 * (1 - elementalResistance(element) / 100)) {
              throw `Could not achieve enough ${element} resistance for ${menuItem.item}.`;
            }
          }
          consumeSafe(countToConsume, menuItem.item);
        } else if ([Mayo.flex, Mayo.zapine].includes(menuItem.item)) {
          MayoClinic.setMayoMinder(menuItem.item);
        } else if (menuItem.item === $item`pocket wish`) {
          acquire(1, $item`pocket wish`, 60000);
          cliExecute(`genie effect ${menuItem.effect}`);
        } else if (menuItem.item === $item`Rethinking Candy`) {
          synthesize(countToConsume, $effect`Synthesis: Greed`);
        } else if (menuItem.item !== $item`Special Seasoning`) {
          consumeSafe(countToConsume, menuItem.item, menuItem.additionalValue);
        }
      }
      dietEntry.quantity -= countToConsume;
    }
  }
}

export function runDiet(simulate = false): void {
  if (myFamiliar() === $familiar`Stooper`) {
    useFamiliar($familiar`none`);
  }

  const dietBuilder = computeDiet();

  if (simulate) {
    if (!get("_mimeArmyShotglassUsed")) {
      printDiet(dietBuilder.shotglass());
    }

    print("===== SIMULATED DIET =====");
    printDiet(dietBuilder.diet());
  } else {
    pillCheck();

    nonOrganAdventures();

    if (have($item`astral six-pack`)) {
      use($item`astral six-pack`);
    }
    if (!get("_mimeArmyShotglassUsed")) {
      consumeDiet(dietBuilder.shotglass());
    }

    if (
      get("barrelShrineUnlocked") &&
      !get("_barrelPrayer") &&
      $classes`Turtle Tamer, Accordion Thief`.includes(myClass())
    ) {
      cliExecute("barrelprayer buff");
    }

    consumeDiet(dietBuilder.diet());
  }
}
