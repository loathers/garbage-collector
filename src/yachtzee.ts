import {
  adv1,
  canInteract,
  chew,
  cliExecute,
  drink,
  eat,
  effectModifier,
  fullnessLimit,
  haveEffect,
  inebrietyLimit,
  Item,
  maximize,
  myClosetMeat,
  myFullness,
  myInebriety,
  myLevel,
  myLocation,
  myMeat,
  mySpleenUse,
  numericModifier,
  print,
  putCloset,
  retrievePrice,
  spleenLimit,
  takeCloset,
  use,
  useFamiliar,
  useSkill,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $items,
  $location,
  $skill,
  clamp,
  get,
  getActiveSongs,
  have,
  Mood,
  property,
  set,
} from "libram";
import { acquire } from "./acquire";
import { runDiet } from "./diet";
import { hasMonsterReplacers } from "./extrovermectin";
import { globalOptions } from "./lib";
import { meatMood } from "./mood";
import { garboValue } from "./session";

class dietEntry<T> {
  name: string;
  quantity: number;
  fullness: number;
  drunkenness: number;
  spleen: number;
  action: (n: number) => T;

  constructor(
    name: string,
    quantity: number,
    fullness: number,
    drunkenness: number,
    spleen: number,
    action: (n: number) => T
  ) {
    this.name = name;
    this.quantity = quantity;
    this.fullness = fullness;
    this.drunkenness = drunkenness;
    this.spleen = spleen;
    this.action = action;
  }
}

function castOde(turns: number): boolean {
  if (!have($skill`The Ode to Booze`)) return false;
  for (const song of getActiveSongs()) {
    const slot = Mood.defaultOptions.songSlots.find((slot) => slot.includes(song));
    if (!slot && song !== $effect`Ode to Booze`) {
      cliExecute(`shrug ${song}`);
    }
  }
  // Shrug default Mood songs
  cliExecute(`shrug ur-kel`);
  cliExecute(`shrug phat loot`);

  while (haveEffect($effect`Ode to Booze`) < turns) {
    useSkill($skill`The Ode to Booze`);
  }
  return true;
}

function splitDietEntry(entry: dietEntry<void>): Array<dietEntry<void>> {
  const entries = new Array<dietEntry<void>>();
  for (let i = 0; i < entry.quantity; i++) {
    entries.push(
      new dietEntry(entry.name, 1, entry.fullness, entry.drunkenness, entry.spleen, entry.action)
    );
  }
  return entries;
}

function combineDietEntries(left: dietEntry<void>, right: dietEntry<void>): dietEntry<void> {
  return new dietEntry(
    left.name,
    left.quantity + right.quantity,
    left.fullness,
    left.drunkenness,
    left.spleen,
    left.action
  );
}

function yachtzeeDietScheduler(menu: Array<dietEntry<void>>): Array<dietEntry<void>> {
  const dietSchedule = new Array<dietEntry<void>>();
  const remainingMenu = new Array<dietEntry<void>>();

  // We assume the menu was constructed such that we will not overshoot our fullness and inebriety limits
  // We also assume the only non-zero fullness/drunkenness entries are the sliders and pickle juices
  // This makes it trivial to plan the diet
  // First, lay out all the spleen cleansers
  for (const entry of menu) {
    if (entry.spleen < 0) {
      for (const splitEntry of splitDietEntry(entry)) dietSchedule.push(splitEntry);
    } else {
      for (const splitEntry of splitDietEntry(entry)) remainingMenu.push(splitEntry);
    }
  }

  // Then, greedily inject spleen items into the schedule with the ordering:
  // 1) Front to back of the schedule
  // 2) Large spleen cleansers to small spleen cleansers
  // This works because stench jellies are of size 1, so we can always pack efficiently using the greedy approach
  remainingMenu.sort((left, right) => {
    return right.spleen - left.spleen;
  });

  for (const entry of remainingMenu) {
    let idx = 0;
    let spleenUse = mySpleenUse();
    while (
      idx < dietSchedule.length &&
      ((dietSchedule.at(idx)?.spleen ?? 0) >= 0 || // We only insert if there's a cleanser immediately after where we want to insert
        spleenUse + entry.spleen > spleenLimit() || // But don't insert if we will overshoot our spleen limit
        spleenUse + (dietSchedule.at(idx)?.spleen ?? 0) >= 0) // And cluster spleen cleansers (continue if the next cleanser can still clean our spleen)
    ) {
      spleenUse += dietSchedule.at(idx++)?.spleen ?? 0;
    }
    dietSchedule.splice(idx, 0, entry);
  }

  // Next, combine clustered entries where possible (this is purely for aesthetic reasons)
  let idx = 0;
  while (idx < dietSchedule.length - 1) {
    if ((dietSchedule.at(idx)?.name ?? "left") === (dietSchedule.at(idx + 1)?.name ?? "right")) {
      dietSchedule.splice(
        idx,
        2,
        combineDietEntries(
          dietSchedule.at(idx) ??
            new dietEntry<void>("Invalid Entry", 0, 0, 0, 0, (n: number) => {
              n;
            }),
          dietSchedule.at(idx + 1) ??
            new dietEntry<void>("Invalid Entry", 0, 0, 0, 0, (n: number) => {
              n;
            })
        )
      );
    } else idx++;
  }

  // Print diet schedule
  for (const entry of dietSchedule) print(`Using ${entry.quantity} ${entry.name}`);

  // Finally, run a check to ensure everything is fine
  let fullness = myFullness();
  let drunkenness = myInebriety();
  let spleenUse = mySpleenUse();
  for (const entry of dietSchedule) {
    if (entry.name === "Invalid Entry") throw "Error in diet schedule: Invalid entry found";
    fullness += entry.fullness;
    drunkenness += entry.drunkenness;
    spleenUse += entry.spleen;
    if (fullness > fullnessLimit()) throw "Error in diet schedule: Overeating";
    else if (drunkenness > inebrietyLimit()) throw "Error in diet schedule: Overdrinking";
    else if (spleenUse > spleenLimit()) throw "Error in diet schedule: Overuse of spleen";
  }

  return dietSchedule;
}

function yachtzeeChainDiet(): boolean {
  if (get("_garboYachtzeeChainDieted")) return true;

  // Plan for Yachtzee Chain
  // 1) Fish Juice Box + Fishy Pipe for 30 turns of Fishy and Really Deep Breath (so we can ignore underwater gear)
  // 2) PYEC to extend Fishy + Really Deep Breath if possible
  // 3) Chew 30 (or 35 with PYEC) Stench Jellies (ensure that we have enough organ space)
  // 4) Find meat and famwt buff that makes sense for a 2k base drop
  // 5) Plant underwater friar's plant if possible

  const havePYECCharge = have($item`Platinum Yendorian Express Card`) && !get(`expressCardUsed`);
  const maxYachtzeeTurns = havePYECCharge ? 35 : 30;

  // Plan our diet (positive values give space, negative values take space)
  const sliders = Math.floor((fullnessLimit() - myFullness()) / 5);
  const pickleJuice = Math.floor((inebrietyLimit() - myInebriety()) / 5);
  const synth = haveEffect($effect`Synthesis: Greed`) < 30 ? 0 : -1;
  const filters = 3 - get(`currentMojoFilters`);
  const extros = hasMonsterReplacers() ? -4 : 0; // save some spleen for macroed embezzlies
  const availableSpleen =
    spleenLimit() - mySpleenUse() + 5 * sliders + 5 * pickleJuice + synth + filters + extros;
  if (!get("_stenchJellyCharges")) set("_stenchJellyCharges", 0);
  const currentJellyCharges = property.getNumber("_stenchJellyCharges") ?? 0; // This should always be zero unless we crashed out

  // If currentJellyCharges > 0, then we were in the middle of prepping for yachtzee
  if (availableSpleen + currentJellyCharges < 30) {
    if (currentJellyCharges > 0) {
      throw "Unexpected error: We have some stench jelly charges, but cannot continue filling up to the optimum amount due to a previous abort";
    }
    return false;
  }

  const yachtzeeTurns =
    availableSpleen + currentJellyCharges >= maxYachtzeeTurns ? maxYachtzeeTurns : 30;

  // Compute prices to make sure everything is worth it
  const fishJuiceBoxPrice = retrievePrice($item`fish juice box`);
  const jelliesBulkPrice = retrievePrice($item`stench jelly`, yachtzeeTurns);
  const extroPrice = retrievePrice($item`Extrovermectin™`);
  const VOA = get("valueOfAdventure");
  const slidersPrice = retrievePrice($item`extra-greasy slider`);
  const pickleJuicePrice = retrievePrice($item`jar of fermented pickle juice`);

  // We prefer using pickle juice to cleanse our spleen for stench jellies since
  // 1) It's cheaper
  // 2) Our stomach can be used for horseradish buffs
  const spleenToClean =
    yachtzeeTurns -
    currentJellyCharges -
    filters -
    synth -
    extros -
    (spleenLimit() - mySpleenUse());
  const pickleJuiceToDrink = clamp(Math.ceil(spleenToClean / 5), 0, pickleJuice);
  const slidersToEat = clamp(Math.ceil(spleenToClean / 5) - pickleJuiceToDrink, 0, sliders);
  const extrosToChew = -extros / 2;
  const synthToUse = -synth;

  // If we need spleen cleansers but their prices are unreasonable, just return
  const maxSliderPrice = 150000,
    maxPickleJuicePrice = 150000;
  if (slidersToEat > 0 && retrievePrice($item`extra-greasy slider`) > maxSliderPrice) return false;
  else if (
    pickleJuiceToDrink > 0 &&
    retrievePrice($item`jar of fermented pickle juice`) > maxPickleJuicePrice
  ) {
    return false;
  }

  const earlyMeatDropsEstimate =
    !have($effect`Synthesis: Greed`) && have($skill`Sweet Synthesis`)
      ? numericModifier("Meat Drop") + 300
      : numericModifier("Meat Drop");

  // Some iffy calculations here
  // If the best diet (at current prices) includes sliders and pickle juice (s+pj), no issues there
  // However, if the best diet does not include s+pj, then we need to compute the loss of switching
  // from the best diet to s+pj, and add it to our jellyValuePerSpleen calculations
  // Let's just say (for now) that sliders are at best worth 70k and pickle juices are worth 60k
  const slidersExcessCost = slidersPrice > 70000 ? slidersPrice - 70000 : 0;
  const pickleJuiceExcessCost = pickleJuicePrice > 60000 ? pickleJuicePrice - 60000 : 0;

  // We assume that the embezzlers after yachtzee chaining would still benefit from our start-of-day buffs
  // so the assumption is that all the gregged embezzlies can be approximated as marginal KGEs with profits of 2 * 3 * VOA
  const extroValuePerSpleen = 6 * VOA - extroPrice / 2;
  const jellyValuePerSpleen =
    (earlyMeatDropsEstimate * 2000) / 100 -
    (jelliesBulkPrice +
      fishJuiceBoxPrice +
      slidersToEat * slidersExcessCost +
      pickleJuiceToDrink * pickleJuiceExcessCost) /
      yachtzeeTurns;

  if (jellyValuePerSpleen < extroValuePerSpleen) return false; // We should do extros instead since they are more valuable

  // Acquire everything we need before using stuff
  const stenchJelliesToUse = yachtzeeTurns - currentJellyCharges;
  acquire(stenchJelliesToUse, $item`stench jelly`, (2 * jelliesBulkPrice) / yachtzeeTurns);
  if (extrosToChew > 0) {
    acquire(extrosToChew, $item`Extrovermectin™`, 100000);
  }
  if (pickleJuiceToDrink > 0) {
    acquire(pickleJuiceToDrink, $item`jar of fermented pickle juice`, maxPickleJuicePrice);
  }
  if (slidersToEat > 0) acquire(slidersToEat, $item`extra-greasy slider`, maxSliderPrice);
  if (haveEffect($effect`Fishy`) + 20 + (havePYECCharge ? 5 : 0) < yachtzeeTurns) {
    acquire(1, $item`fish juice box`, 2 * fishJuiceBoxPrice);
  }
  if (filters > 0) acquire(filters, $item`mojo filter`, 2 * garboValue($item`mojo filter`));

  const dietArray = [
    new dietEntry(`extra-greasy slider`, slidersToEat, 5, 0, -5, (n: number) => {
      eat(n, $item`extra-greasy slider`);
    }),
    new dietEntry(`jar of fermented pickle juice`, pickleJuiceToDrink, 0, 5, -5, (n: number) => {
      castOde(n * 5);
      drink(n, $item`jar of fermented pickle juice`);
    }),
    new dietEntry(`Extrovermectin™`, extrosToChew, 0, 0, 2, (n: number) => {
      chew(n, $item`Extrovermectin™`);
    }),
    new dietEntry("synthesis", synthToUse, 0, 0, 1, (n: number) => {
      for (let i = 0; i < n; i++) cliExecute("synthesize meat");
    }),
    new dietEntry(`mojo filter`, filters, 0, 0, -1, (n: number) => {
      use(n, $item`mojo filter`);
    }),
    new dietEntry(`stench jelly`, yachtzeeTurns - currentJellyCharges, 0, 0, 1, (n: number) => {
      chew(n, $item`stench jelly`);
      set("_stenchJellyCharges", property.getNumber("_stenchJellyCharges") + n);
    }),
  ];

  const dietSchedule = yachtzeeDietScheduler(dietArray);
  for (const entry of dietSchedule) entry.action(entry.quantity);

  if (haveEffect($effect`Fishy`) + 20 + (havePYECCharge ? 5 : 0) < yachtzeeTurns) {
    use(1, $item`fish juice box`);
  }
  if (!get("fishyPipeUsed")) use(1, $item`fishy pipe`);

  set("_garboYachtzeeChainDieted", true);

  // Checks
  if (slidersToEat > 0) throw `We still have ${slidersToEat} sliders to eat!`;
  else if (pickleJuiceToDrink > 0) {
    throw `We still have ${pickleJuiceToDrink} pickle juice to drink!`;
  } else if (stenchJelliesToUse > 0) {
    throw `We still have ${stenchJelliesToUse} stench jellies to use!`;
  } else if (haveEffect($effect`Fishy`) < yachtzeeTurns) {
    throw `We only got ${haveEffect($effect`Fishy`)}/${yachtzeeTurns} turns of fishy!`;
  } else if (property.getNumber("_stenchJellyCharges") < yachtzeeTurns) {
    throw `We only got ${property.getNumber(
      "_stenchJellyCharges"
    )}/${yachtzeeTurns} turns of jelly charges!`;
  }

  // Roughly worth it to use these up to the max values set (I think)
  while (
    myFullness() < fullnessLimit() &&
    haveEffect($effect`Kicked in the Sinuses`) < yachtzeeTurns
  ) {
    acquire(1, $item`jumping horseradish`, 20000);
    if (have($item`jumping horseradish`)) eat(1, $item`jumping horseradish`);
    else break;
  }

  if (mySpleenUse() < spleenLimit() && haveEffect($effect`Eau d' Clochard`) < yachtzeeTurns) {
    acquire(1, $item`beggin' cologne`, 100000);
    if (have($item`beggin' cologne`)) chew(1, $item`beggin' cologne`);
  }

  if (!get(`_freePillKeeperUsed`) && haveEffect($effect`Frosty`) < yachtzeeTurns) {
    acquire(1, $item`frost flower`, 200000);
    if (have($item`frost flower`)) {
      cliExecute("pillkeeper extend");
      use(1, $item`frost flower`);
    }
  }

  return true;
}

function getMeatBuff(it: Item, duration: number): boolean {
  const eff = effectModifier(it, "effect");
  if (haveEffect(eff) >= duration) return true;

  const effectDuration = numericModifier(it, "effect duration");
  const familiarWeight = numericModifier(eff, "Familiar Weight");
  const meatDrop = numericModifier(eff, "Meat Drop") + 2.5 * familiarWeight;
  const maxPrice = Math.round((meatDrop / 100) * Math.min(1.5 * duration, effectDuration) * 2000);
  const currentPrice = retrievePrice(it);

  if (currentPrice <= maxPrice) {
    print(`Actual cost of ${it} (${currentPrice}) is cheaper than effective cost (${maxPrice})`);
  } else {
    print(
      `Actual cost of ${it} (${currentPrice}) is more expensive than effective cost (${maxPrice})`
    );
    return false;
  }

  while (haveEffect(eff) < duration) {
    acquire(1, it, maxPrice);
    if (!have(it)) return false;
    use(1, it);
  }

  return true;
}

function yachtzeeChainBuffs(): void {
  const yachtzeeTurns = Math.min(
    property.getNumber("_stenchJellyCharges"),
    haveEffect($effect`Fishy`)
  );

  for (const it of $items`Mick's IcyVapoHotness Inhaler, Smoldering Clover™ candle, Meat-inflating powder, Polka Pop, Daily Affirmation: Always be Collecting, cuppa Chari tea, airborne mutagen, Gene Tonic: Constellation, patent avarice tonic, blue grass, begpwnia, resolution: be wealthier, pink-frosted astral cupcake, salt wages, blackberry polite, Gene Tonic: Humanoid, shark cartilage, cranberry cordial, resolution: be luckier, baggie of powdered sugar, Friendliness Beverage, disintegrating spiky collar, Daily Affirmation: Work For Hours a Week, Stephen's secret formula, irradiated pet snacks, Gene Tonic: Fish, Gene Tonic: Construct, resolution: be kinder, sugar bunny, green candy heart, half-orchid, gingerbread spice latte`) {
    getMeatBuff(it, yachtzeeTurns);
  }
  if (have($item`Platinum Yendorian Express Card`) && !get(`expressCardUsed`)) {
    use(1, $item`Platinum Yendorian Express Card`);
  }
}

function _yachtzeeChain(): void {
  if (!have($item`fishy pipe`)) return;
  // hard require fishy pipe to run this chain
  else if (!have($familiar`Urchin Urchin`)) return;
  // also hard require urchin urchin for now
  else if (myLevel() <= 13 || !canInteract()) return;
  // We definitely need to be able to eat sliders and drink pickle juice
  else if (get("fishyPipeUsed") && !have($effect`Fishy`)) return;
  // If we have used our fishy pipe and have no fishy turns left, we're probably done
  else if (get("_garboYachtzeeChainCompleted")) return;
  else if (!get("sleazeAirportAlways") && !get("_sleazeAirportToday")) return;

  meatMood(false);
  useFamiliar($familiar`Urchin Urchin`);
  maximize("meat", false);

  putCloset(myMeat() - 3000000);
  if (!yachtzeeChainDiet()) return;
  yachtzeeChainBuffs();
  takeCloset(myClosetMeat());

  let jellyTurns = property.getNumber("_stenchJellyCharges");
  let fishyTurns = haveEffect($effect`Fishy`);
  set("choiceAdventure918", 2);
  while (Math.min(jellyTurns, fishyTurns) > 0) {
    adv1($location`The Sunken Party Yacht`, -1, "");
    if (haveEffect($effect`Fishy`) < fishyTurns) {
      fishyTurns -= 1;
      jellyTurns -= 1;
      set("_stenchJellyCharges", property.getNumber("_stenchJellyCharges") - 1);
    }
    if (
      myLocation().environment === "underwater" &&
      !property.getString("_floristPlantsUsed").includes("Crookweed")
    ) {
      cliExecute("florist plant Crookweed");
    }
  }
  set("choiceAdventure918", "");
  set("_garboYachtzeeChainCompleted", true);
}

export function yachtzeeChain(): void {
  if (!globalOptions.yachtzeeChain) return;
  _yachtzeeChain();
  if (!globalOptions.noDiet) runDiet();
}
