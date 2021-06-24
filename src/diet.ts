import {
  myFullness,
  fullnessLimit,
  use,
  print,
  myInebriety,
  inebrietyLimit,
  itemAmount,
  toInt,
  myClass,
  getProperty,
  mallPrice,
  cliExecute,
  setProperty,
  useSkill,
  mySpleenUse,
  spleenLimit,
  chew,
  equip,
  takeCloset,
  closetAmount,
  buy,
  drink,
  eat,
  shopAmount,
  takeShop,
  maximize,
  myLevel,
  myMaxhp,
  haveEffect,
  myAdventures,
  sweetSynthesis,
  userConfirm,
  myFamiliar,
  useFamiliar,
} from "kolmafia";
import { $class, $effect, $item, $items, $skill, get, have, $familiar, set } from "libram";
import { clamp, ensureEffect } from "./lib";

const MPA = get("valueOfAdventure");
print(`Using adventure value ${MPA}.`, "blue");

function totalAmount(item: Item): number {
  return shopAmount(item) + itemAmount(item);
}

function itemPriority(...items: Item[]) {
  for (const item of items) {
    if (have(item)) return item;
  }
  return items[items.length - 1];
}

const priceCaps: { [index: string]: number } = {
  "jar of fermented pickle juice": 75000,
  "Frosty's frosty mug": 45000,
  "extra-greasy slider": 45000,
  "Ol' Scratch's salad fork": 50000,
  "transdermal smoke patch": 8000,
  "voodoo snuff": 36000,
  "antimatter wad": 24000,
  "octolus oculus": 12000,
  "blood-drive sticker": 210000,
  "spice melange": 500000,
  "splendid martini": 20000,
  "Eye and a Twist": 20000,
  "jumping horseradish": 20000,
  "Ambitious Turkey": 20000,
  "Special Seasoning": 20000,
};

function acquire(qty: number, item: Item, maxPrice?: number) {
  if (maxPrice === undefined) maxPrice = priceCaps[item.name];
  if (maxPrice === undefined) throw `No price cap for ${item.name}.`;

  if (qty * mallPrice(item) > 1000000) throw "bad get!";

  let remaining = qty - itemAmount(item);
  if (remaining <= 0) return;

  const getCloset = Math.min(remaining, closetAmount(item));
  if (!takeCloset(getCloset, item)) throw "failed to remove from closet";
  remaining -= getCloset;
  if (remaining <= 0) return;

  let getMall = Math.min(remaining, shopAmount(item));
  if (!takeShop(getMall, item)) {
    cliExecute("refresh shop");
    cliExecute("refresh inventory");
    remaining = qty - itemAmount(item);
    getMall = Math.min(remaining, shopAmount(item));
    if (!takeShop(getMall, item)) throw "failed to remove from shop";
  }
  remaining -= getMall;
  if (remaining <= 0) return;

  buy(remaining, item, maxPrice);
  if (itemAmount(item) < qty) throw `Mall price too high for ${item.name}.`;
}

function eatSafe(qty: number, item: Item) {
  acquire(qty, $item`Special Seasoning`);
  acquire(qty, item);
  if (!eat(qty, item)) throw "Failed to eat safely";
}

function drinkSafe(qty: number, item: Item) {
  acquire(qty, item);
  if (!drink(qty, item)) throw "Failed to drink safely";
}

function chewSafe(qty: number, item: Item) {
  acquire(qty, item);
  if (!chew(qty, item)) throw "Failed to chew safely";
}

function eatSpleen(qty: number, item: Item) {
  if (mySpleenUse() < 5) throw "No spleen to clear with this.";
  eatSafe(qty, item);
}

function drinkSpleen(qty: number, item: Item) {
  if (mySpleenUse() < 5) throw "No spleen to clear with this.";
  drinkSafe(qty, item);
}

function adventureGain(item: Item) {
  if (item.adventures.includes("-")) {
    const [min, max] = item.adventures.split("-").map((s) => parseInt(s, 10));
    return (min + max) / 2.0;
  } else {
    return parseInt(item.adventures, 10);
  }
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
      acquire(1, item, maxPrice);
      use(1, item);
    } else {
      print(`Skipping ${item.name}; too expensive (${mallPrice(item)} > ${maxPrice}).`);
    }
  }
}

const valuePerSpleen = (item: Item) => -(adventureGain(item) * MPA - mallPrice(item)) / item.spleen;
let savedBestSpleenItem: Item | null = null;
let savedPotentialSpleenItems: Item[] | null = null;
function getBestSpleenItems() {
  if (savedBestSpleenItem === null || savedPotentialSpleenItems === null) {
    savedPotentialSpleenItems = $items`octolus oculus, transdermal smoke patch, antimatter wad, voodoo snuff, blood-drive sticker`;
    savedPotentialSpleenItems.sort((x, y) => valuePerSpleen(x) - valuePerSpleen(y));
    for (const spleenItem of savedPotentialSpleenItems) {
      print(`${spleenItem} value/spleen: ${-valuePerSpleen(spleenItem)}`);
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

function fillAllSpleen(): void {
  const { potentialSpleenItems } = getBestSpleenItems();
  for (const spleenItem of potentialSpleenItems) {
    print(`Filling spleen with ${spleenItem}.`);
    fillSpleenWith(spleenItem);
  }
}

function fillSpleenWith(spleenItem: Item) {
  if (mySpleenUse() + spleenItem.spleen <= spleenLimit()) {
    // (adventureGain * spleenA + adventures) * 1.04 + 40 = 30 * spleenB + synthTurns
    // spleenA + spleenB = spleenTotal
    // (adventureGain * (spleenTotal - spleenB) + adventures) * 1.04 + 40 = 30 * spleenB + synthTurns
    // 1.04 * adventureGain * (spleenTotal - spleenB) + 1.04 * adventures + 40 = 30 * spleenB + synthTurns
    // 1.04 * adventureGain * spleenTotal - 1.04 * adventureGain * spleenB + 1.04 * adventures + 40 = 30 * spleenB + synthTurns
    // 1.04 * adventureGain * spleenTotal + 1.04 * adventures + 40 = 30 * spleenB + synthTurns + 1.04 * adventureGain * spleenB
    // (1.04 * adventureGain * spleenTotal + 1.04 * adventures + 40 - synthTurns) / (30 + 1.04 * adventureGain) = spleenB
    const synthTurns = haveEffect($effect`Synthesis: Greed`);
    const spleenTotal = spleenLimit() - mySpleenUse();
    const adventuresPerItem = adventureGain(spleenItem);
    const spleenSynth = Math.ceil(
      (1.04 * adventuresPerItem * spleenTotal + 1.04 * myAdventures() + 40 - synthTurns) /
        (30 + 1.04 * adventuresPerItem)
    );
    if (have($skill`Sweet Synthesis`)) {
      for (let i = 0; i < clamp(spleenSynth, 0, spleenLimit() - mySpleenUse()); i++) {
        sweetSynthesis($effect`Synthesis: Greed`);
      }
    }
    const count = Math.floor((spleenLimit() - mySpleenUse()) / spleenItem.spleen);
    acquire(count, spleenItem);
    chewSafe(count, spleenItem);
  }
}

function fillStomach() {
  if (
    myLevel() >= 15 &&
    !get("_hungerSauceUsed") &&
    mallPrice($item`Hunger&trade; sauce`) < 3 * MPA
  ) {
    acquire(1, $item`Hunger&trade; sauce`, 3 * MPA);
    use(1, $item`Hunger&trade; sauce`);
  }
  useIfUnused($item`milk of magnesium`, "_milkOfMagnesiumUsed", 5 * MPA);

  while (myFullness() + 5 <= fullnessLimit()) {
    if (myMaxhp() < 1000) maximize("0.05hp, hot res", false);
    const count = Math.floor(Math.min((fullnessLimit() - myFullness()) / 5, mySpleenUse() / 5));
    eatSpleen(count, $item`Ol' Scratch's salad fork`);
    eatSpleen(count, $item`extra-greasy slider`);
    fillSomeSpleen();
  }
}

function fillLiver() {
  if (myFamiliar() === $familiar`Stooper`) {
    useFamiliar($familiar`none`);
  }
  if (!get("_mimeArmyShotglassUsed") && itemAmount($item`mime army shotglass`) > 0) {
    equip($item`tuxedo shirt`);
    drink(itemPriority($item`astral pilsner`, $item`splendid martini`));
  }
  while (myInebriety() + 1 <= inebrietyLimit() && itemAmount($item`astral pilsner`) > 0) {
    drink(1, $item`astral pilsner`);
  }
  while (myInebriety() + 5 <= inebrietyLimit()) {
    if (myMaxhp() < 1000) maximize("0.05hp, cold res", false);
    const count = Math.floor(Math.min((inebrietyLimit() - myInebriety()) / 5, mySpleenUse() / 5));
    drinkSpleen(count, $item`Frosty's frosty mug`);
    drinkSpleen(count, $item`jar of fermented pickle juice`);
    fillSomeSpleen();
  }
}

export function runDiet(): void {
  if (mySpleenUse() === 0) {
    ensureEffect($effect`Eau d' Clochard`);
    if (have($skill`Sweet Synthesis`)) ensureEffect($effect`Synthesis: Collection`);
    if (have($item`body spradium`)) ensureEffect($effect`Boxing Day Glow`);
  }

  useIfUnused($item`fancy chocolate car`, get("_chocolatesUsed") === 0, 2 * MPA);

  const loveChocolateCount = Math.max(3 - Math.floor(20000 / MPA) - get("_loveChocolatesUsed"), 0);
  const loveChocolateEat = Math.min(
    loveChocolateCount,
    itemAmount($item`LOV Extraterrestrial Chocolate`)
  );
  use(loveChocolateEat, $item`LOV Extraterrestrial Chocolate`);

  const choco = new Map([
    [toInt($class`Seal Clubber`), $item`chocolate seal-clubbing club`],
    [toInt($class`Turtle Tamer`), $item`chocolate turtle totem`],
    [toInt($class`Pastamancer`), $item`chocolate pasta spoon`],
    [toInt($class`Sauceror`), $item`chocolate saucepan`],
    [toInt($class`Accordion Thief`), $item`chocolate stolen accordion`],
    [toInt($class`Disco Bandit`), $item`chocolate disco ball`],
  ]);
  if (choco.has(toInt(myClass())) && get("_chocolatesUsed") < 3) {
    const used = get("_chocolatesUsed");
    const item = choco.get(toInt(myClass())) || $item`none`;
    const count = clamp(3 - used, 0, 3);
    use(count, item);
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

  useIfUnused($item`borrowed time`, "_borrowedTimeUsed", 5 * MPA);
  fillSomeSpleen();
  fillStomach();
  fillLiver();

  if (!get("_distentionPillUsed") && 1 <= myInebriety()) {
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

  if (!get("_syntheticDogHairPillUsed") && 1 <= myInebriety()) {
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

  const { bestSpleenItem } = getBestSpleenItems();
  const mojoFilterCount = 3 - get("currentMojoFilters");
  acquire(mojoFilterCount, $item`mojo filter`, valuePerSpleen(bestSpleenItem));
  use(mojoFilterCount, $item`mojo filter`);
  fillSomeSpleen();

  while (myFullness() < fullnessLimit()) {
    if (mallPrice($item`fudge spork`) < 3 * MPA && !get("_fudgeSporkUsed"))
      eat(1, $item`fudge spork`);
    eatSafe(1, $item`jumping horseradish`);
  }
  while (myInebriety() < inebrietyLimit()) {
    drinkSafe(1, $item`ambitious turkey`);
  }
}
