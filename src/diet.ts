import { canAdv } from "canadv.ash";
import {
  availableAmount,
  chew,
  cliExecute,
  drink,
  eat,
  elementalResistance,
  fullnessLimit,
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
  $location,
  $skill,
  clamp,
  dietEstimatedTurns,
  get,
  getAverageAdventures,
  getSaleValue,
  have,
  Kmail,
  maximizeCached,
  MayoClinic,
  MenuItem,
  planDiet,
  set,
  sum,
} from "libram";
import { acquire } from "./acquire";
import { embezzlerCount, embezzlerDifferential, estimatedTurns } from "./embezzler";
import { expectedGregs } from "./extrovermectin";
import { arrayEquals, globalOptions } from "./lib";
import { Potion } from "./potions";
import synthesize from "./synthesis";

const MPA = get("valueOfAdventure");
print(`Using adventure value ${MPA}.`, "blue");

const saladFork = $item`Ol' Scratch's salad fork`;
const frostyMug = $item`Frosty's frosty mug`;
const spleenCleaners = $items`extra-greasy slider, jar of fermented pickle juice`;

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

function consumeSafe(qty: number, item: Item, embezzlers = 0) {
  if (spleenCleaners.includes(item) && mySpleenUse() < 5) {
    throw "No spleen to clear with this.";
  }
  if (getAverageAdventures(item) > 0) {
    const priceCap = getAverageAdventures(item) * get("valueOfAdventure");
    acquire(qty, item, priceCap);
  } else if (itemType(item) === "spleen item" && Potion.gross(item, embezzlers) > 0) {
    const priceCap = Potion.gross(item, embezzlers) - 2.5 * MPA;
    acquire(qty, item, priceCap);
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

const stomachLiverCleaners = new Map([
  [$item`spice melange`, [-3, -3]],
  [$item`synthetic dog hair pill`, [0, -1]],
  [$item`cuppa Sobrie tea`, [0, -1]],
]);

const helpers = [Mayo.flex, Mayo.zapine, $item`Special Seasoning`, saladFork, frostyMug];

function menu() {
  return [
    // FOOD
    new MenuItem($item`Dreadsylvanian spooky pocket`),
    new MenuItem($item`tin cup of mulligan stew`),
    new MenuItem($item`glass of raw eggs`, { maximum: availableAmount($item`glass of raw eggs`) }),
    new MenuItem($item`Tea, Earl Grey, Hot`),
    new MenuItem($item`meteoreo`),
    new MenuItem($item`ice rice`),
    new MenuItem($item`frozen banquet`),
    new MenuItem($item`fishy fish lasagna`),
    new MenuItem($item`gnat lasagna`),
    new MenuItem($item`long pork lasagna`),

    // BOOZE
    new MenuItem($item`Dreadsylvanian grimlet`),
    new MenuItem($item`Hodgman's blanket`),
    new MenuItem($item`Sacramento wine`),
    new MenuItem($item`iced plum wine`),
    new MenuItem($item`splendid martini`),
    new MenuItem($item`Eye and a Twist`),
    new MenuItem($item`punch-drunk punch`, { maximum: availableAmount($item`punch-drunk punch`) }),
    new MenuItem($item`blood-red mushroom wine`),
    new MenuItem($item`buzzing mushroom wine`),
    new MenuItem($item`complex mushroom wine`),
    new MenuItem($item`overpowering mushroom wine`),
    new MenuItem($item`smooth mushroom wine`),
    new MenuItem($item`swirling mushroom wine`),
    new MenuItem($item`astral pilsner`, { maximum: availableAmount($item`astral pilsner`) }),

    // SPLEEN
    new MenuItem($item`octolus oculus`),
    new MenuItem($item`cute mushroom`),
    new MenuItem($item`prismatic wad`),
    new MenuItem($item`transdermal smoke patch`),
    new MenuItem($item`antimatter wad`),
    new MenuItem($item`voodoo snuff`),
    new MenuItem($item`blood-drive sticker`),

    // HELPERS
    new MenuItem($item`mojo filter`),
    ...[...stomachLiverCleaners.keys()].map((item) => new MenuItem(item)),
    new MenuItem($item`distention pill`),
    new MenuItem($item`cuppa Voraci tea`),
    ...helpers.map((item) => new MenuItem(item)),
    new MenuItem($item`pocket wish`, { maximum: 1, wishEffect: $effect`Refined Palate` }),
    new MenuItem($item`toasted brie`, { maximum: 1 }),
    new MenuItem($item`potion of the field gar`, { maximum: 1 }),

    // SPLEEN CLEANERS
    ...spleenCleaners.map((item) => new MenuItem(item)),
  ];
}

interface DailyDiet {
  shotglass: () => [MenuItem[], number][];
  diet: () => [MenuItem[], number][];
  pantsgiving: () => [MenuItem[], number][];
}

export function computeDiet(): DailyDiet {
  const cachedEmbezzlers = embezzlerCount();
  const cachedEmbezzlerDifferential = embezzlerDifferential();
  const canPillKeeper =
    have($item`Eight Days a Week Pill Keeper`) && canAdv($location`Cobb's Knob Treasury`, true);
  const gregsPerPill = have($item`miniature crystal ball`) ? 4 : 3;

  function rebalanceMenu(
    baseMenu: MenuItem[],
    expectedTurns: number,
    additionalEmbezzlers: number
  ) {
    const embezzlers = cachedEmbezzlers + additionalEmbezzlers;
    print("=====");
    print(`Rebalancing Diet around ${cachedEmbezzlers} + ${additionalEmbezzlers} Embezzlers`);

    const synthPotion = new Potion($item`Rethinking Candy`, {
      effect: $effect`Synthesis: Greed`,
      duration: 30,
      noUse: true,
    });

    const haveMayo = MayoClinic.installed();
    const barfTurns = expectedTurns - embezzlers;

    function potionMenuItemsFixedAmount(potion: Potion | Item, amount: number, options = {}) {
      if (potion instanceof Item) {
        potion = new Potion(potion);
      }
      const useMayo = haveMayo && itemType(potion.potion) === "food";
      const embezzlerUses = clamp(amount, 0, potion.maximumUses(embezzlers, useMayo));
      const barfUses = clamp(amount - embezzlerUses, 0, potion.maximumUses(barfTurns, useMayo));

      return [
        new MenuItem(potion.potion, {
          ...options,
          maximum: embezzlerUses,
          additionalValue: potion.gross(embezzlers, useMayo),
          mayo: useMayo ? Mayo.zapine : undefined,
        }),
        new MenuItem(potion.potion, {
          ...options,
          maximum: barfUses,
          additionalValue: potion.gross(0, useMayo),
          mayo: useMayo ? Mayo.zapine : undefined,
        }),
      ];
    }
    function potionMenuItems(potion: Potion | Item, options = {}) {
      return potionMenuItemsFixedAmount(potion, 1000, options);
    }

    const maxFoodCones =
      availableAmount($item`Dinsey food-cone`) +
      Math.floor(
        get("_stenchAirportToday") || get("stenchAirportAlways")
          ? availableAmount($item`FunFunds™`) / 20
          : 0
      );
    const foodConeCost = (2 * getSaleValue($item`one-day ticket to Dinseylandfill`)) / 20;

    const potionMenu = [
      ...baseMenu,
      // FOOD POTIONS
      ...potionMenuItems(new Potion($item`jumping horseradish`)),
      ...potionMenuItems(new Potion($item`tempura cauliflower`)),
      ...potionMenuItems(new Potion($item`sea truffle`)),
      ...potionMenuItems(new Potion($item`tempura broccoli`)),
      ...potionMenuItemsFixedAmount(new Potion($item`Dinsey food-cone`), maxFoodCones, {
        priceOverride: foodConeCost,
      }),

      // BOOZE POTIONS
      ...potionMenuItems($item`dirt julep`),
      ...potionMenuItems($item`Ambitious Turkey`),
      ...potionMenuItems($item`Friendly Turkey`),
      ...potionMenuItems($item`vintage smart drink`),

      // SPLEEN POTION
      ...potionMenuItems($item`beggin' cologne`),
      ...potionMenuItemsFixedAmount($item`body spradium`, availableAmount($item`body spradium`)),
      ...potionMenuItems($item`Knob Goblin pet-buffing spray`),
      ...potionMenuItems($item`Knob Goblin nasal spray`),
      ...potionMenuItems(synthPotion, {
        size: 1,
        organ: "spleen item",
        priceOverride: 0, // for now, assume synth is basically free
      }),
      new MenuItem($item`Extrovermectin™`, {
        additionalValue: expectedGregs() * cachedEmbezzlerDifferential,
        maximum: 1,
      }),
      new MenuItem($item`Extrovermectin™`, {
        additionalValue: gregsPerPill * cachedEmbezzlerDifferential,
      }),
      new MenuItem($item`Eight Days a Week Pill Keeper`, {
        additionalValue: cachedEmbezzlerDifferential,
        maximum: canPillKeeper ? 1 : "auto",
      }),
    ];

    // We don't have a property to check if nothing has been eaten, so use this hack.
    // This will fail in the rare case where someone has eaten non-PVPable food
    // and then cleansed back down to 0.
    if (
      have($item`spaghetti breakfast`) &&
      myFullness() === 0 &&
      get("_timeSpinnerFoodAvailable") === "" &&
      !get("_spaghettiBreakfastEaten")
    ) {
      potionMenu.push(new MenuItem($item`spaghetti breakfast`, { maximum: 1 }));
    }

    return potionMenu;
  }

  const cachedEstimatedTurns = estimatedTurns();

  function fullRebalance(baseMenu: MenuItem[]) {
    let balancedMenu = baseMenu;
    let diet = planDiet(MPA, balancedMenu, [
      ["food", null],
      ["booze", null],
    ]);

    balancedMenu = rebalanceMenu(
      baseMenu,
      Math.floor(cachedEstimatedTurns + dietEstimatedTurns(diet)),
      dietEmbezzlers(diet)
    );
    diet = planDiet(MPA, balancedMenu, [
      ["food", null],
      ["booze", null],
      ["spleen item", null],
    ]);

    balancedMenu = rebalanceMenu(
      baseMenu,
      Math.floor(cachedEstimatedTurns + dietEstimatedTurns(diet)),
      dietEmbezzlers(diet)
    );
    diet = planDiet(MPA, balancedMenu, [
      ["food", null],
      ["booze", null],
      ["spleen item", null],
    ]);

    balancedMenu = rebalanceMenu(
      baseMenu,
      Math.floor(cachedEstimatedTurns + dietEstimatedTurns(diet)),
      dietEmbezzlers(diet)
    );
    diet = planDiet(MPA, balancedMenu, [
      ["food", null],
      ["booze", null],
      ["spleen item", null],
    ]);

    balancedMenu = rebalanceMenu(
      baseMenu,
      Math.floor(cachedEstimatedTurns + dietEstimatedTurns(diet)),
      dietEmbezzlers(diet)
    );
    diet = planDiet(MPA, balancedMenu, [
      ["food", null],
      ["booze", null],
      ["spleen item", null],
    ]);

    return rebalanceMenu(
      baseMenu,
      Math.floor(cachedEstimatedTurns + dietEstimatedTurns(diet)),
      dietEmbezzlers(diet)
    );
  }

  return {
    shotglass: () => {
      const shotglassMenu = menu().filter(
        (menuItem) => itemType(menuItem.item) === "booze" && menuItem.item.inebriety === 1
      );
      return planDiet(MPA, fullRebalance(shotglassMenu), [["booze", 1]]);
    },
    diet: () => {
      return planDiet(MPA, fullRebalance(menu()), [
        ["food", null],
        ["booze", null],
        ["spleen item", null],
      ]);
    },
    pantsgiving: () => {
      const pantsgivingMenu = menu().filter(
        (menuItem) => itemType(menuItem.item) === "food" && menuItem.item.fullness === 1
      );
      return planDiet(MPA, fullRebalance(pantsgivingMenu), [["food", 1]]);
    },
  };
}

function dietEmbezzlers(diet: [MenuItem[], number][]) {
  const totalExtroPills = sum(
    diet,
    (dietItem) =>
      dietItem[1] * (dietItem[0].map((i) => i.item).includes($item`Extrovermectin™`) ? 1 : 0)
  );
  const totalPillkeeperPills = sum(
    diet,
    (dietItem) =>
      dietItem[1] *
      (dietItem[0].map((i) => i.item).includes($item`Eight Days a Week Pill Keeper`) ? 1 : 0)
  );
  return (
    Math.max(totalExtroPills, 1) * expectedGregs() +
    Math.max(totalExtroPills - 1, 0) * (have($item`miniature crystal ball`) ? 4 : 3) +
    totalPillkeeperPills
  );
}

function printDiet(diet: [MenuItem[], number][]) {
  let totalPrice = 0;
  for (const [menuItems, count] of diet) {
    if (count === 0) continue;
    const item = menuItems[menuItems.length - 1];

    const maxstr = item.maximum !== undefined ? ` max ${item.maximum}` : "";
    const valstr =
      item.additionalValue !== undefined
        ? ` (added value: ${Math.floor(item.additionalValue)})`
        : "";
    const cost = menuItems.reduce((total, menuItem) => (total += menuItem.price()), 0);
    const addlstr = menuItems.length > 1 ? ` with ${menuItems.slice(0, -1).join(", ")}` : "";
    totalPrice += cost * count;

    print(`${count} ${item.item}${maxstr}${valstr}${addlstr} (cost: ${cost} ea)`);
  }
  print(`Total Price: ${totalPrice}`);
}

function additionalValue(diet: [MenuItem[], number][]) {
  return diet.reduce(
    (total, dietItem) => sum(dietItem[0], (menuItem) => menuItem.additionalValue ?? 0),
    0
  );
}

// Item priority - higher means we eat it first.
// Anything that gives a consumption buff should go first (e.g. Refined Palate).
function itemPriority(menuItems: MenuItem[]) {
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

function consumeDiet(diet: [MenuItem[], number][]) {
  diet.sort(([x], [y]) => -(itemPriority(x) - itemPriority(y)));
  const embezzlers = embezzlerCount() + dietEmbezzlers(diet);

  const seasoningCount = sum(diet, ([menuItems, count]) =>
    menuItems.some((menuItem) => menuItem.item === $item`Special Seasoning`) ? count : 0
  );
  acquire(seasoningCount, $item`Special Seasoning`, MPA);

  // Fill organs in rounds, making sure we're making progress in each round.
  const organs = () => [myFullness(), myInebriety(), mySpleenUse()];
  let lastOrgans = [-1, -1, -1];
  while (sum(diet, ([, count]) => count) > 0) {
    if (arrayEquals(lastOrgans, organs())) {
      print();
      print("==== REMAINING DIET BEFORE ERROR ====");
      printDiet(diet);
      print();
      throw "Failed to consume some diet item.";
    }
    lastOrgans = organs();

    for (const itemCount of diet) {
      const [menuItems, count] = itemCount;
      if (count === 0) continue;

      let countToConsume = count;
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
          MayoClinic.setMayoMinder(menuItem.item, countToConsume);
        } else if (menuItem.item === $item`Rethinking Candy`) {
          synthesize(countToConsume, $effect`Synthesis: Greed`);
        } else if (menuItem.item === $item`Eight Days a Week Pill Keeper`) {
          globalOptions.pillKeeperUses += countToConsume;
        } else if (menuItem.item === $item`pocket wish`) {
          acquire(1, $item`pocket wish`, 60000);
          cliExecute(`genie effect ${menuItem.wishEffect}`);
        } else if (menuItem.item !== $item`Special Seasoning`) {
          consumeSafe(countToConsume, menuItem.item, embezzlers);
        }
      }
      itemCount[1] -= countToConsume;
    }
  }
}

export function runDiet(): void {
  pillCheck();

  nonOrganAdventures();

  if (myFamiliar() === $familiar`Stooper`) useFamiliar($familiar`none`);
  if (have($item`astral six-pack`)) use($item`astral six-pack`);

  if (
    get("barrelShrineUnlocked") &&
    !get("_barrelPrayer") &&
    $classes`Turtle Tamer, Accordion Thief`.includes(myClass())
  ) {
    cliExecute("barrelprayer buff");
  }

  const dietComputer = computeDiet();
  if (!get("_mimeArmyShotglassUsed")) {
    const shotglassDiet = dietComputer.shotglass();
    print("===== SHOTGLASS DIET =====");
    printDiet(shotglassDiet);
    print();

    consumeDiet(shotglassDiet);
  }

  const diet = dietComputer.diet();
  const addlGregs = dietEmbezzlers(diet);
  const firstGregs = Math.floor(expectedGregs());
  const embezzlers = embezzlerCount() + firstGregs + addlGregs;
  const embezzlerStr = `(Start of day: ${embezzlerCount()}, First gregs: ${firstGregs}, Additional gregs ${addlGregs}`;
  const adventures = dietEstimatedTurns(diet);
  const totalValue = Math.floor((estimatedTurns() + adventures) * MPA + additionalValue(diet));

  // Sort descending by item priority.

  print("===== PLANNED DIET =====");
  printDiet(diet);
  print();
  print(`Expecting to Fight ${embezzlers} embezzlers (${embezzlerStr})`);
  print(
    `Expecting to generate ${adventures} adventures (in addition to base adventures ${estimatedTurns()}) for a value of ${totalValue}`
  );

  consumeDiet(diet);
}

export function fillPantsgiving(): void {
  const dietComputer = computeDiet();
  return consumeDiet(dietComputer.pantsgiving());
}
