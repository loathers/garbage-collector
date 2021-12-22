import {
  availableAmount,
  buy,
  chew,
  cliExecute,
  drink,
  eat,
  elementalResistance,
  equip,
  fullnessLimit,
  getProperty,
  getWorkshed,
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
  ensureEffect,
  get,
  getAverageAdventures,
  getModifier,
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
import { usingThumbRing } from "./dropsgear";
import { embezzlerCount, estimatedTurns } from "./embezzler";
import { expectedGregs } from "./extrovermectin";
import { argmax, arrayEquals, baseMeat, globalOptions } from "./lib";
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

function consumeSafe(qty: number, item: Item) {
  if (spleenCleaners.includes(item) && mySpleenUse() < 5) {
    throw "No spleen to clear with this.";
  }
  if (getAverageAdventures(item) > 0) {
    const priceCap = getAverageAdventures(item) * get("valueOfAdventure");
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

function estimatedTurnsWithOrgans(diet: [MenuItem[], number][], includeSpleen = true) {
  // FIXME: Just get the actual predicted adventure value of the diet.
  const includedItems = new Set(
    ([] as MenuItem[])
      .concat(...diet.filter(([, count]) => count > 0).map(([menuItems]) => menuItems))
      .map((menuItem) => menuItem.item)
  );
  const fullnessAvailable =
    fullnessLimit() +
    (includedItems.has($item`spice melange`) ? 3 : 0) +
    (includedItems.has($item`cuppa Voraci tea`) ? 1 : 0) +
    (includedItems.has($item`distention pill`) ? 1 : 0) -
    myFullness();
  const inebrietyAvailable =
    inebrietyLimit() +
    (includedItems.has($item`spice melange`) ? 3 : 0) +
    (includedItems.has($item`cuppa Sobrie tea`) ? 1 : 0) +
    (includedItems.has($item`synthetic dog hair pill`) ? 1 : 0) -
    myInebriety();
  const spleenAvailable = spleenLimit() + (3 - get("currentMojoFilters")) - mySpleenUse();
  const thumbRingMultiplier = usingThumbRing() ? 1 / 0.96 : 1;
  return (
    estimatedTurns() +
    thumbRingMultiplier *
      (7.5 * Math.max(0, fullnessAvailable) +
        9 * Math.max(0, inebrietyAvailable) +
        (includeSpleen ? 2 * Math.max(0, spleenAvailable) : 0))
  );
}

function valuePerSpleen(item: Item) {
  const price =
    item === $item`coffee pixie stick` ? 10 * mallPrice($item`Game Grid ticket`) : mallPrice(item);
  return (getAverageAdventures(item) * MPA - price) / item.spleen;
}
let savedBestSpleenItem: Item | null = null;
let savedPotentialSpleenItems: Item[] | null = null;
function getBestSpleenItems() {
  if (savedBestSpleenItem === null || savedPotentialSpleenItems === null) {
    savedPotentialSpleenItems = $items`octolus oculus, cute mushroom, prismatic wad, transdermal smoke patch, antimatter wad, voodoo snuff, blood-drive sticker`;
    savedPotentialSpleenItems.sort((x, y) => valuePerSpleen(y) - valuePerSpleen(x));
    for (const spleenItem of savedPotentialSpleenItems) {
      print(`${spleenItem} value/spleen: ${valuePerSpleen(spleenItem)}`);
    }
    savedBestSpleenItem = savedPotentialSpleenItems[0];
  }

  return { bestSpleenItem: savedBestSpleenItem, potentialSpleenItems: savedPotentialSpleenItems };
}

function fillSomeSpleen(diet: [MenuItem[], number][]) {
  const { bestSpleenItem } = getBestSpleenItems();
  fillSpleenWith(bestSpleenItem, diet);
}

function fillSpleenWith(spleenItem: Item, diet: [MenuItem[], number][]) {
  if (mySpleenUse() < spleenLimit()) {
    // (itemAdvs * spleenItem + adventures) * 1.04 = 30 * spleenSynth + synthTurns
    // spleenItem + spleenSynth = spleenTotal
    // (itemAdvs * (spleenTotal - spleenSynth) + adventures) * 1.04 = 30 * spleenSynth + synthTurns
    // 1.04 * itemAdvs * (spleenTotal - spleenSynth) + 1.04 * adventures = 30 * spleenSynth + synthTurns
    // 1.04 * itemAdvs * spleenTotal - 1.04 * itemAdvs * spleenSynth + 1.04 * adventures = 30 * spleenSynth + synthTurns
    // 1.04 * itemAdvs * spleenTotal + 1.04 * adventures = 30 * spleenSynth + synthTurns + 1.04 * itemAdvs * spleenSynth
    // (1.04 * itemAdvs * spleenTotal + 1.04 * adventures - synthTurns) / (30 + 1.04 * itemAdvs) = spleenSynth
    const synthTurns = haveEffect($effect`Synthesis: Greed`);
    const spleenTotal = spleenLimit() - mySpleenUse();
    const adventuresPerSpleen = getAverageAdventures(spleenItem) / spleenItem.spleen;
    const thumbRingMultiplier = have($item`mafia thumb ring`) ? 1 / 0.96 : 1;
    // when not barfing, only get synth for estimatedTurns() turns (ignore adv gain)
    const spleenAdvsGained = globalOptions.noBarf
      ? 0
      : thumbRingMultiplier * adventuresPerSpleen * spleenTotal;
    const spleenSynth = Math.ceil(
      (spleenAdvsGained + estimatedTurnsWithOrgans(diet, false) - synthTurns) /
        (30 + thumbRingMultiplier * adventuresPerSpleen)
    );
    if (have($skill`Sweet Synthesis`)) {
      synthesize(clamp(spleenSynth, 0, spleenTotal), $effect`Synthesis: Greed`);
    }
    const count = Math.max(0, Math.floor((spleenLimit() - mySpleenUse()) / spleenItem.spleen));
    chewSafe(count, spleenItem);
  }
}

function fillShotglass() {
  if (!get("_mimeArmyShotglassUsed") && have($item`mime army shotglass`)) {
    if (have($item`astral pilsner`)) {
      drinkSafe(1, $item`astral pilsner`);
    } else {
      equip($item`tuxedo shirt`);
      drinkSafe(1, $item`splendid martini`);
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
export function computeDiet(): [MenuItem[], number][] {
  // Roughly estimate how much spleen we need to clear for synth.
  const expectedTurns = estimatedTurnsWithOrgans([]);
  const spleenNeeded = Math.ceil((expectedTurns - haveEffect($effect`Synthesis: Greed`)) / 30);
  const additionalSpleenNeeded = Math.max(
    0,
    spleenNeeded - Math.max(0, spleenLimit() - mySpleenUse()) - (3 - get("currentMojoFilters"))
  );
  const spleenCleanersNeeded = Math.ceil(additionalSpleenNeeded / 5);
  const spleenCleaner = argmax(spleenCleaners.map((item) => [item, mallPrice(item)]));

  const embezzlers = embezzlerCount();
  const helpers = [Mayo.flex, $item`Special Seasoning`, saladFork, frostyMug];
  const menu = [
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

    // Additional spleen cleaning to fill up on synth.
    new MenuItem(spleenCleaner, {
      maximum: spleenCleanersNeeded,
      additionalValue: 3 * 150 * baseMeat,
    }),

    // HELPERS
    ...[...stomachLiverCleaners.keys()].map((item) => new MenuItem(item)),
    new MenuItem($item`distention pill`),
    new MenuItem($item`cuppa Voraci tea`),
    ...helpers.map((item) => new MenuItem(item)),
    new MenuItem($item`pocket wish`, { maximum: 1, wishEffect: $effect`Refined Palate` }),
    new MenuItem($item`toasted brie`, { maximum: 1 }),
    new MenuItem($item`potion of the field gar`, { maximum: 1 }),
  ];

  const haveMayo = getWorkshed() === $item`portable Mayo Clinic`;
  for (const item of $items`jumping horseradish, dirt julep, Ambitious Turkey`) {
    const effect = getModifier("Effect", item);
    const useMayo = itemType(item) === "food" && haveMayo;
    const effectDuration = getModifier("Effect Duration", item) * (useMayo ? 2 : 1);
    const meatDrop = getModifier("Meat Drop", effect) / 100;
    const value = meatDrop * effectDuration * baseMeat;
    const maximumCount = Math.ceil((expectedTurns - haveEffect(effect)) / effectDuration);
    if (maximumCount > 0) {
      menu.push(new MenuItem(item, { maximum: maximumCount, additionalValue: value }));
    }
    if (haveEffect(effect) < effectDuration) {
      // Adjust value of horseradish if we have mayo, since we're using Mayozapine instead of Mayoflex.
      const firstValue =
        value + meatDrop * Math.min(embezzlers, effectDuration) * 750 - (useMayo ? MPA : 0);
      menu.push(new MenuItem(item, { maximum: 1, additionalValue: firstValue }));
    }
  }

  // We don't have a property to check if nothing has been eaten, so use this hack.
  // This will fail in the rare case where someone has eaten non-PVPable food
  // and then cleansed back down to 0.
  if (
    have($item`spaghetti breakfast`) &&
    myFullness() === 0 &&
    get("_timeSpinnerFoodAvailable") === "" &&
    !get("_spaghettiBreakfastEaten")
  ) {
    menu.push(new MenuItem($item`spaghetti breakfast`, { maximum: 1 }));
  }

  // Only use our astral pilsners if we're ascending. Otherwise they're good for shotglass.
  if (have($item`astral pilsner`) && globalOptions.ascending) {
    menu.push(
      new MenuItem($item`astral pilsner`, {
        maximum: availableAmount($item`astral pilsner`),
      })
    );
  }

  // Handle spleen manually, as the diet planner doesn't support synth. Only fill food and booze.
  return planDiet(MPA, menu, [
    ["food", null],
    ["booze", null],
  ]);
}

function printDiet(diet: [MenuItem[], number][]) {
  for (const [menuItems, count] of diet) {
    if (count === 0) continue;
    const item = menuItems[menuItems.length - 1];
    print(
      `${count} ${item.item}${item.maximum !== undefined ? ` max ${item.maximum}` : ""}${
        menuItems.length > 1 ? ` with ${menuItems.slice(0, -1).join(", ")}` : ""
      }`
    );
  }
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

export function runDiet(): void {
  pillCheck();

  nonOrganAdventures();

  if (myFamiliar() === $familiar`Stooper`) {
    useFamiliar($familiar`none`);
  }

  if (have($item`astral six-pack`)) {
    use($item`astral six-pack`);
  }

  fillShotglass();

  if (
    get("barrelShrineUnlocked") &&
    !get("_barrelPrayer") &&
    $classes`Turtle Tamer, Accordion Thief`.includes(myClass())
  ) {
    cliExecute("barrelprayer buff");
  }

  const { bestSpleenItem } = getBestSpleenItems();
  const embezzlers = embezzlerCount();
  if (embezzlers) {
    if (
      mySpleenUse() + 2 <= spleenLimit() &&
      !get("beGregariousCharges") &&
      !(
        get("beGregariousFightsLeft") &&
        get("beGregariousMonster") === $monster`Knob Goblin Embezzler`
      )
    ) {
      const value = expectedGregs() * 25000;
      if (
        value - mallPrice($item`Extrovermectin™`) >
        5 * MPA - 2 * mallPrice($item`transdermal smoke patch`)
      ) {
        acquire(1, $item`Extrovermectin™`, value);
        chew(1, $item`Extrovermectin™`);
      }
    }
    if (mySpleenUse() < spleenLimit()) {
      if (!have($effect`Eau d' Clochard`)) {
        if (!have($item`beggin' cologne`)) {
          const cologne = new Potion($item`beggin' cologne`);
          const equilibriumPrice = cologne.gross(embezzlers) - valuePerSpleen(bestSpleenItem);
          if (equilibriumPrice > 0) buy(1, $item`beggin' cologne`, equilibriumPrice);
        }
        if (have($item`beggin' cologne`)) {
          chew(1, $item`beggin' cologne`);
        }
      }
    }
    if (have($item`body spradium`) && mySpleenUse() < spleenLimit()) {
      ensureEffect($effect`Boxing Day Glow`);
    }
  }

  const diet = computeDiet();

  // Sort descending by item priority.
  diet.sort(([x], [y]) => -(itemPriority(x) - itemPriority(y)));

  print();
  print("===== PLANNED DIET =====");
  printDiet(diet);
  print();

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

      // Handle spleen manually.
      if (menuItems.some((menuItem) => itemType(menuItem.item) === "spleen item")) continue;

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
        } else if (menuItem.item === Mayo.flex) {
          if (menuItems[menuItems.length - 1].item === $item`jumping horseradish`) {
            MayoClinic.setMayoMinder(Mayo.zapine, countToConsume);
          } else {
            MayoClinic.setMayoMinder(Mayo.flex, countToConsume);
          }
        } else if (menuItem.item === $item`pocket wish`) {
          acquire(1, $item`pocket wish`, 60000);
          cliExecute(`genie effect ${menuItem.wishEffect}`);
        } else if (menuItem.item !== $item`Special Seasoning`) {
          consumeSafe(countToConsume, menuItem.item);
        }
      }
      itemCount[1] -= countToConsume;
    }

    fillSomeSpleen(diet);
  }

  // FIXME: More accurate decision on whether to use mojo filters.
  const mojoFilterCount = 3 - get("currentMojoFilters");
  let spleenValue = valuePerSpleen(bestSpleenItem);
  if (haveEffect($effect`Synthesis: Greed`) < estimatedTurns()) {
    // Estimate 3000 meat candy price per synth.
    spleenValue = Math.max(spleenValue, 3 * 30 * baseMeat - 3000);
  }
  if (mallPrice($item`mojo filter`) < spleenValue) {
    acquire(mojoFilterCount, $item`mojo filter`, spleenValue, false);
    if (have($item`mojo filter`)) {
      use(Math.min(mojoFilterCount, availableAmount($item`mojo filter`)), $item`mojo filter`);
      fillSomeSpleen(diet);
    }
  }
}
