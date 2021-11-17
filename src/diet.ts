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
  sweetSynthesis,
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
  $skill,
  clamp,
  ensureEffect,
  get,
  getAverageAdventures,
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
import { embezzlerCount, estimatedTurns } from "./embezzler";
import { arrayEquals, baseMeat, globalOptions } from "./lib";
import { Potion } from "./potions";

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
  if (
    $items`jar of fermented pickle juice, extra-greasy slider`.includes(item) &&
    mySpleenUse() < 5
  ) {
    throw "No spleen to clear with this.";
  }
  const priceCap = getAverageAdventures(item) * get("valueOfAdventure");
  acquire(qty, item, priceCap);
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

function valuePerSpleen(item: Item) {
  const price =
    item === $item`coffee pixie stick` ? 10 * mallPrice($item`Game Grid ticket`) : mallPrice(item);
  return (getAverageAdventures(item) * MPA - price) / item.spleen;
}
let savedBestSpleenItem: Item | null = null;
let savedPotentialSpleenItems: Item[] | null = null;
function getBestSpleenItems() {
  if (savedBestSpleenItem === null || savedPotentialSpleenItems === null) {
    savedPotentialSpleenItems = $items`octolus oculus, transdermal smoke patch, antimatter wad, voodoo snuff, blood-drive sticker`;
    savedPotentialSpleenItems.sort((x, y) => valuePerSpleen(y) - valuePerSpleen(x));
    for (const spleenItem of savedPotentialSpleenItems) {
      print(`${spleenItem} value/spleen: ${valuePerSpleen(spleenItem)}`);
    }
    savedBestSpleenItem = savedPotentialSpleenItems[0];
  }

  return { bestSpleenItem: savedBestSpleenItem, potentialSpleenItems: savedPotentialSpleenItems };
}

function fillSomeSpleen() {
  const { bestSpleenItem } = getBestSpleenItems();
  print(`Spleen item: ${bestSpleenItem}`);
  fillSpleenWith(bestSpleenItem);
}

function fillSpleenWith(spleenItem: Item) {
  if (mySpleenUse() + spleenItem.spleen <= spleenLimit()) {
    // (getAverageAdventures * spleenA + adventures) * 1.04 + 40 = 30 * spleenB + synthTurns
    // spleenA + spleenB = spleenTotal
    // (getAverageAdventures * (spleenTotal - spleenB) + adventures) * 1.04 + 40 = 30 * spleenB + synthTurns
    // 1.04 * getAverageAdventures * (spleenTotal - spleenB) + 1.04 * adventures + 40 = 30 * spleenB + synthTurns
    // 1.04 * getAverageAdventures * spleenTotal - 1.04 * getAverageAdventures * spleenB + 1.04 * adventures + 40 = 30 * spleenB + synthTurns
    // 1.04 * getAverageAdventures * spleenTotal + 1.04 * adventures + 40 = 30 * spleenB + synthTurns + 1.04 * getAverageAdventures * spleenB
    // (1.04 * getAverageAdventures * spleenTotal + 1.04 * adventures + 40 - synthTurns) / (30 + 1.04 * getAverageAdventures) = spleenB
    const synthTurns = haveEffect($effect`Synthesis: Greed`);
    const spleenTotal = spleenLimit() - mySpleenUse();
    const adventuresPerItem = getAverageAdventures(spleenItem);
    // when not barfing, only get synth for estimatedTurns() turns (ignore adv gain)
    const spleenAdvsGained = globalOptions.noBarf ? 0 : 1.04 * adventuresPerItem * spleenTotal;
    const spleenSynth = Math.ceil(
      (spleenAdvsGained + estimatedTurns() - synthTurns) / (30 + 1.04 * adventuresPerItem)
    );
    if (have($skill`Sweet Synthesis`)) {
      for (let i = 0; i < clamp(spleenSynth, 0, spleenLimit() - mySpleenUse()); i++) {
        sweetSynthesis($effect`Synthesis: Greed`);
      }
    }
    const count = Math.floor((spleenLimit() - mySpleenUse()) / spleenItem.spleen);
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
    if (
      (have($item`distention pill`, 1) || !get<boolean>("garbo_skipPillCheck", false)) &&
      !use($item`distention pill`)
    ) {
      print("WARNING: Out of distention pills.", "red");
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
    if (
      (have($item`synthetic dog hair pill`, 1) || !get<boolean>("garbo_skipPillCheck", false)) &&
      !use($item`synthetic dog hair pill`)
    ) {
      print("WARNING: Out of synthetic dog hair pills.", "red");
    }
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
    if (have($skill`Sweet Synthesis`) && mySpleenUse() < spleenLimit()) {
      ensureEffect($effect`Synthesis: Collection`);
    }
    if (have($item`body spradium`) && mySpleenUse() < spleenLimit()) {
      ensureEffect($effect`Boxing Day Glow`);
    }
  }

  const liverStomachCleaners = $items`spice melange, distention pill, synthetic dog hair pill, cuppa Voraci tea, cuppa Sobrie tea`;
  const helpers = [Mayo.flex, $item`Special Seasoning`, saladFork, frostyMug];
  const haveMayo = getWorkshed() === $item`portable Mayo Clinic`;
  const horseradishLength = haveMayo ? 100 : 50;
  // Adjust value of horseradish if we have mayo, since we're using Mayozapine instead of Mayoflex.
  const horseradishValue =
    horseradishLength * baseMeat +
    Math.min(horseradishLength, embezzlers) * 750 -
    (haveMayo ? MPA : 0);
  const menu = [
    // BOOZE
    new MenuItem($item`dirt julep`, {
      maximum: 1,
      additionalValue: 40 * baseMeat + Math.min(embezzlers, 40) * 750,
    }),
    new MenuItem($item`Ambitious Turkey`, {
      maximum: 1,
      additionalValue: 0.25 * (50 * baseMeat + Math.min(embezzlers, 50) + 750),
    }),
    new MenuItem($item`Ambitious Turkey`, { additionalValue: 0.25 * 50 * baseMeat }),
    new MenuItem($item`jar of fermented pickle juice`),
    new MenuItem($item`Sacramento wine`),
    new MenuItem($item`splendid martini`),
    new MenuItem($item`punch-drunk punch`),
    new MenuItem($item`blood-red mushroom wine`),
    new MenuItem($item`buzzing mushroom wine`),
    new MenuItem($item`complex mushroom wine`),
    new MenuItem($item`overpowering mushroom wine`),
    new MenuItem($item`smooth mushroom wine`),
    new MenuItem($item`swirling mushroom wine`),
    new MenuItem($item`Hodgman's blanket`),

    // FOOD
    new MenuItem($item`jumping horseradish`, {
      maximum: 1,
      additionalValue: horseradishValue,
    }),
    new MenuItem($item`extra-greasy slider`),
    new MenuItem($item`tin cup of mulligan stew`),
    new MenuItem($item`Tea, Earl Grey, Hot`),
    new MenuItem($item`meteoreo`),
    new MenuItem($item`glass of raw eggs`),
    new MenuItem($item`ice rice`),
    new MenuItem($item`frozen banquet`),

    // HELPERS
    ...liverStomachCleaners.map((item) => new MenuItem(item)),
    ...helpers.map((item) => new MenuItem(item)),
    new MenuItem($item`pocket wish`, { maximum: 1, wishEffect: $effect`Refined Palate` }),
  ];

  // Only use our astral pilsners if we're ascending. Otherwise they're good for shotglass.
  if (have($item`astral pilsner`) && globalOptions.ascending) {
    menu.push(
      new MenuItem($item`astral pilsner`, {
        maximum: availableAmount($item`astral pilsner`),
      })
    );
  }

  // Handle spleen manually, as the diet planner doesn't support synth. Only fill food and booze.
  const diet = planDiet(MPA, menu);

  fillSomeSpleen();

  // Fill organs in rounds, making sure we're making progress in each round.
  const organs = () => [myFullness(), myInebriety(), mySpleenUse()];
  let lastOrgans = [-1, -1, -1];
  while (sum(diet, ([, count]) => count) > 0) {
    if (arrayEquals(lastOrgans, organs())) {
      throw "Stuck in an infinite loop in diet code.";
    }

    for (const itemCount of diet) {
      const [menuItems, count] = itemCount;
      if (count === 0) continue;

      // Handle spleen manually.
      if (menuItems.some((menuItem) => itemType(menuItem.item) === "spleen item")) continue;

      let countToConsume = count;
      if (menuItems.some((menuItem) => spleenCleaners.includes(menuItem.item))) {
        countToConsume = Math.min(countToConsume, Math.floor(mySpleenUse() / 5));
      }

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
          if (menuItem.item === $item`jumping horseradish`) {
            MayoClinic.setMayoMinder(Mayo.zapine, countToConsume);
          } else {
            MayoClinic.setMayoMinder(Mayo.flex, countToConsume);
          }
        } else if (menuItem.item !== $item`Special Seasoning`) {
          consumeSafe(countToConsume, menuItem.item);
        }
      }
      itemCount[1] -= countToConsume;
    }

    fillSomeSpleen();
    lastOrgans = organs();
  }

  const mojoFilterCount = 3 - get("currentMojoFilters");
  acquire(mojoFilterCount, $item`mojo filter`, valuePerSpleen(bestSpleenItem), false);
  if (have($item`mojo filter`)) {
    use(Math.min(mojoFilterCount, availableAmount($item`mojo filter`)), $item`mojo filter`);
    fillSomeSpleen();
  }
}

export function horseradish(): void {
  if (myFullness() < fullnessLimit()) {
    MayoClinic.setMayoMinder(MayoClinic.Mayo.zapine, 1);
    eatSafe(1, $item`jumping horseradish`);
  }
}
