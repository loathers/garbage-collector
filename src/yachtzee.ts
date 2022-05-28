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
  myMeat,
  mySpleenUse,
  numericModifier,
  print,
  retrievePrice,
  spleenLimit,
  use,
  useFamiliar,
  useSkill,
  visitUrl,
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
import { prepFamiliars } from "./dailies";
import { runDiet } from "./diet";
import { estimatedTurns } from "./embezzler";
import { hasMonsterReplacers } from "./extrovermectin";
import { globalOptions, safeRestore } from "./lib";
import { meatMood } from "./mood";
import { potionSetup } from "./potions";
import { garboValue } from "./session";
import synthesize from "./synthesis";

class dietEntry<T> {
  name: string;
  quantity: number;
  fullness: number;
  drunkenness: number;
  spleen: number;
  action: (n: number, name?: string) => T;

  constructor(
    name: string,
    quantity: number,
    fullness: number,
    drunkenness: number,
    spleen: number,
    action: (n: number, name?: string) => T
  ) {
    this.name = name;
    this.quantity = quantity;
    this.fullness = fullness;
    this.drunkenness = drunkenness;
    this.spleen = spleen;
    this.action = action;
  }
}

class dietUtils {
  dietArray: Array<dietEntry<void>>;
  pref: string;
  originalPref: string;

  constructor(action?: (n: number, name?: string) => void) {
    this.originalPref = !get("_garboYachtzeeChainDiet")
      ? ""
      : property.getString("_garboYachtzeeChainDiet");
    this.pref = "";
    this.dietArray = [
      new dietEntry(`extra-greasy slider`, 0, 5, 0, -5, (n: number) => {
        eat(n, $item`extra-greasy slider`);
      }),
      new dietEntry(`jar of fermented pickle juice`, 0, 0, 5, -5, (n: number) => {
        castOde(5 * n);
        drink(n, $item`jar of fermented pickle juice`);
      }),
      new dietEntry(`Extrovermectin™`, 0, 0, 0, 2, (n: number) => {
        chew(n, $item`Extrovermectin™`);
      }),
      new dietEntry("synthesis", 0, 0, 0, 1, (n: number) => {
        synthesize(n, $effect`Synthesis: Greed`);
      }),
      new dietEntry(`mojo filter`, 0, 0, 0, -1, (n: number) => {
        use(n, $item`mojo filter`);
      }),
      new dietEntry(`beggin' cologne`, 0, 0, 0, 1, (n: number) => {
        chew(n, $item`beggin' cologne`);
      }),
    ];
    if (action) this.dietArray.forEach((entry) => (entry.action = action));
  }

  public setDietEntry(name: string, qty?: number, action?: (n: number, name?: string) => void) {
    this.dietArray.forEach((entry) => {
      if (entry.name === name) {
        if (qty) entry.quantity = qty;
        if (action) entry.action = action;
      }
    });
  }

  public resetDietPref() {
    this.originalPref = "";
    this.pref = "";
  }

  public addToPref(n: number, name?: string) {
    if (!name) throw "Diet pref must have a name";
    for (let i = 0; i < n; i++) {
      this.pref = this.pref.concat(name ?? "").concat(",");
    }
  }

  public setDietPref() {
    set("_garboYachtzeeChainDiet", this.originalPref.concat(this.pref));
  }
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

function castOde(turns: number): boolean {
  if (!have($skill`The Ode to Booze`)) return false;
  for (const song of getActiveSongs()) {
    const slot = Mood.defaultOptions.songSlots.find((slot) => slot.includes(song));
    if (
      !slot &&
      song !== $effect`Ode to Booze` &&
      song !== $effect`Polka of Plenty` &&
      song !== $effect`Chorale of Companionship` &&
      song !== $effect`The Ballad of Richie Thingfinder`
    ) {
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

function executeNextDietStep(): void {
  if (property.getBoolean("stenchJellyUsed")) return;
  print("Executing next diet steps", "blue");
  const dietUtil = new dietUtils();
  dietUtil.resetDietPref();

  const dietString = property.getString("_garboYachtzeeChainDiet").split(",");
  let stenchJellyConsumed = false;
  for (const name of dietString) {
    if (name.length === 0) continue;
    else if (!stenchJellyConsumed && name === "stench jelly") {
      chew(1, $item`stench jelly`);
      set("stenchJellyUsed", true);
      stenchJellyConsumed = true;
      set("_garboYachtzeeChainDiet", "");
    } else if (!stenchJellyConsumed) {
      dietUtil.dietArray.forEach((entry) => {
        if (entry.name === name) {
          if (myFullness() + entry.fullness > fullnessLimit()) {
            throw `consuming ${entry.name} will exceed our fullness limit`;
          } else if (myInebriety() + entry.drunkenness > inebrietyLimit()) {
            throw `consuming ${entry.name} will exceed our inebriety limit`;
          } else if (mySpleenUse() + entry.spleen > spleenLimit()) {
            throw `consuming ${entry.name} will exceed our spleen limit`;
          }
          entry.action(1);
        }
      });
    } else {
      dietUtil.addToPref(1, name);
    }
  }
  dietUtil.setDietPref();

  if (!stenchJellyConsumed) {
    throw "We completed our entire diet but failed to get a stench jelly charge";
  }
}

function yachtzeeDietScheduler(menu: Array<dietEntry<void>>): Array<dietEntry<void>> {
  const dietSchedule = new Array<dietEntry<void>>();
  const remainingMenu = new Array<dietEntry<void>>();
  const jellies = new Array<dietEntry<void>>();
  // We assume the menu was constructed such that we will not overshoot our fullness and inebriety limits
  // We also assume the only non-zero fullness/drunkenness entries are the sliders and pickle juices
  // This makes it trivial to plan the diet
  // First, lay out all the spleen cleansers
  for (const entry of menu) {
    if (entry.spleen < 0) {
      for (const splitEntry of splitDietEntry(entry)) dietSchedule.push(splitEntry);
    } else if (entry.name === "Stench Jelly") {
      for (const splitEntry of splitDietEntry(entry)) jellies.push(splitEntry);
    } else {
      for (const splitEntry of splitDietEntry(entry)) remainingMenu.push(splitEntry);
    }
  }

  // Then, greedily inject spleen items into the schedule with the ordering:
  // 1) Front to back of the schedule
  // 2) Large spleen damagers to small spleen damagers
  // This works because stench jellies are of size 1, so we can always pack efficiently using the greedy approach
  remainingMenu.sort((left, right) => {
    return right.spleen - left.spleen;
  });

  // Schedule jellies last so we definitely get spleen buffs first (e.g. synth and cologne)
  for (const spleeners of [remainingMenu, jellies]) {
    for (const entry of spleeners) {
      let idx = 0;
      let spleenUse = mySpleenUse();
      while (
        idx < dietSchedule.length &&
        (dietSchedule[idx].spleen >= 0 || // We only insert if there's a cleanser immediately after where we want to insert
          spleenUse + entry.spleen > spleenLimit() || // But don't insert if we will overshoot our spleen limit
          (idx > 0 &&
            dietSchedule[idx - 1].spleen < 0 &&
            spleenUse + dietSchedule[idx].spleen >= 0)) // And cluster spleen cleansers (continue if the next cleanser can still clean our spleen)
      ) {
        spleenUse += dietSchedule[idx++].spleen ?? 0;
      }
      dietSchedule.splice(idx, 0, entry);
    }
  }

  // Next, combine clustered entries where possible (this is purely for aesthetic reasons)
  let idx = 0;
  while (idx < dietSchedule.length - 1) {
    if (dietSchedule[idx].name === dietSchedule[idx + 1].name) {
      dietSchedule.splice(idx, 2, combineDietEntries(dietSchedule[idx], dietSchedule[idx + 1]));
    } else idx++;
  }

  // Print diet schedule
  print("Diet schedule:", "blue");
  for (const entry of dietSchedule) print(`Use ${entry.quantity} ${entry.name}`, "blue");

  // Finally, run a check to ensure everything is fine
  let fullness = myFullness();
  let drunkenness = myInebriety();
  let spleenUse = mySpleenUse();
  for (const entry of dietSchedule) {
    fullness += entry.fullness;
    drunkenness += entry.drunkenness;
    spleenUse += entry.spleen;
    if (fullness > fullnessLimit()) throw "Error in diet schedule: Overeating";
    else if (drunkenness > inebrietyLimit()) throw "Error in diet schedule: Overdrinking";
    else if (spleenUse > spleenLimit()) throw "Error in diet schedule: Overuse of spleen";
  }

  return dietSchedule;
}

export function yachtzeeChainDiet(simOnly?: boolean): boolean {
  if (get("_garboYachtzeeChainDietPlanned")) return true;

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
  const reqSynthTurns = 150; // We will be left with (150 - yachtzeeTurns) after chaining
  const synth =
    haveEffect($effect`Synthesis: Greed`) < reqSynthTurns
      ? -Math.ceil(reqSynthTurns - haveEffect($effect`Synthesis: Greed`)) / 30
      : 0;
  const filters = 3 - get(`currentMojoFilters`);
  const extros = hasMonsterReplacers() ? -(4 - Math.min(4, 2 * get("beGregariousCharges"))) : 0; // save some spleen for macroed embezzlies
  let availableSpleen =
    spleenLimit() - mySpleenUse() + 5 * sliders + 5 * pickleJuice + synth + filters + extros;
  set("_stenchJellyChargeTarget", 0);

  // If currentJellyChargeTarget > 0, then we were in the middle of prepping for yachtzee
  if (availableSpleen < 30) {
    print("We were unable to generate enough organ space for optimal yachtzee chaining", "red");
    return false;
  }

  const yachtzeeTurns = availableSpleen >= maxYachtzeeTurns ? maxYachtzeeTurns : 30;

  let cologne = 0;
  if (
    availableSpleen >= yachtzeeTurns + 1 &&
    haveEffect($effect`Eau d' Clochard`) < yachtzeeTurns
  ) {
    cologne = 1;
    availableSpleen -= 1;
  }

  print(`Trying to run ${yachtzeeTurns} turns of Yachtzee`, "purple");

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
  const spleenToClean = yachtzeeTurns - filters - synth - extros - (spleenLimit() - mySpleenUse());
  const pickleJuiceToDrink = clamp(Math.ceil(spleenToClean / 5), 0, pickleJuice);
  const slidersToEat = clamp(Math.ceil(spleenToClean / 5) - pickleJuiceToDrink, 0, sliders);
  const extrosToChew = -extros / 2;
  const synthToUse = -synth;

  // If we need spleen cleansers but their prices are unreasonable, just return
  const maxSliderPrice = 150000,
    maxPickleJuicePrice = 150000;
  if (slidersToEat > 0 && retrievePrice($item`extra-greasy slider`) > maxSliderPrice) {
    print("Sliders are way too overpriced for us to clean spleens for jellies", "red");
    return false;
  } else if (
    pickleJuiceToDrink > 0 &&
    retrievePrice($item`jar of fermented pickle juice`) > maxPickleJuicePrice
  ) {
    print("Pickle juices are way too overpriced for us to clean spleens for jellies", "red");
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
  // so the assumption is that all the gregged embezzlies can be approximated as marginal KGEs with profits of 3.5 * VOA
  const extroValuePerSpleen = 7 * VOA - extroPrice / 2;
  const jellyValuePerSpleen =
    (earlyMeatDropsEstimate * 2000) / 100 -
    (jelliesBulkPrice +
      fishJuiceBoxPrice +
      slidersToEat * slidersExcessCost +
      pickleJuiceToDrink * pickleJuiceExcessCost) /
      yachtzeeTurns;

  print(`Early Meat Drop Modifier: ${earlyMeatDropsEstimate}%`);
  print(`Extro value per spleen: ${extroValuePerSpleen}`);
  print(`Jelly value per spleen: ${jellyValuePerSpleen}`);
  if (jellyValuePerSpleen < extroValuePerSpleen && !simOnly) {
    print("Running extros is more profitable than chaining yachtzees", "red");
    return false; // We should do extros instead since they are more valuable
  }

  // Schedule our diet first
  const addPref = (n: number, name?: string) => {
    dietUtil.addToPref(n, name);
  };
  const dietUtil = new dietUtils(addPref);
  dietUtil.resetDietPref();
  dietUtil.setDietEntry(`extra-greasy slider`, slidersToEat);
  dietUtil.setDietEntry(`jar of fermented pickle juice`, pickleJuiceToDrink);
  dietUtil.setDietEntry(`Extrovermectin™`, extrosToChew);
  dietUtil.setDietEntry(`synthesis`, synthToUse);
  dietUtil.setDietEntry(`mojo filter`, filters);
  dietUtil.setDietEntry(`beggin' cologne`, cologne);
  dietUtil.setDietEntry(`stench jelly`, yachtzeeTurns, (n: number, name?: string) => {
    dietUtil.addToPref(n, name);
    if (!simOnly) {
      set("_stenchJellyChargeTarget", property.getNumber("_stenchJellyChargeTarget") + n);
    }
  });

  // Run diet scheduler
  print("Scheduling diet", "purple");
  const dietSchedule = yachtzeeDietScheduler(dietUtil.dietArray);

  // Now execute the diet
  for (const entry of dietSchedule) entry.action(entry.quantity, entry.name);
  dietUtil.setDietPref();

  if (simOnly) return true;

  if (property.getNumber("_stenchJellyChargeTarget") < yachtzeeTurns) {
    throw `We are only able to obtain up to ${property.getNumber(
      "_stenchJellyChargeTarget"
    )}/${yachtzeeTurns} turns of jelly charges!`;
  }

  // Acquire everything we need
  acquire(
    yachtzeeTurns,
    $item`stench jelly`,
    (2 * jelliesBulkPrice) / yachtzeeTurns,
    true,
    1.2 * jelliesBulkPrice // Bulk jelly purchases may cost > 1m in the future
  );
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
  if (cologne > 0) acquire(cologne, $item`beggin' cologne`, 100000);
  if (filters > 0) acquire(filters, $item`mojo filter`, 2 * garboValue($item`mojo filter`));

  // Get fishy turns
  print("Getting fishy turns", "purple");
  if (haveEffect($effect`Fishy`) + 20 + (havePYECCharge ? 5 : 0) < yachtzeeTurns) {
    use(1, $item`fish juice box`);
  }
  if (!get("fishyPipeUsed")) use(1, $item`fishy pipe`);

  // Final checks
  if (haveEffect($effect`Fishy`) + (havePYECCharge ? 5 : 0) < yachtzeeTurns) {
    throw `We only got ${haveEffect($effect`Fishy`)}/${yachtzeeTurns} turns of fishy!`;
  }

  set("_garboYachtzeeChainDietPlanned", true);

  print("Executing buffing diet", "purple");
  if (!get("_milkOfMagnesiumUsed")) {
    acquire(1, $item`milk of magnesium`, 10000);
    use(1, $item`milk of magnesium`);
  }
  if (!get("_distentionPillUsed") && have($item`distention pill`)) {
    use(1, $item`distention pill`);
  }
  // Roughly worth it to use these up to the max values set (I think)
  while (
    myFullness() + 1 + sliders < fullnessLimit() &&
    haveEffect($effect`Kicked in the Sinuses`) < yachtzeeTurns
  ) {
    acquire(1, $item`jumping horseradish`, 20000);
    if (have($item`jumping horseradish`)) eat(1, $item`jumping horseradish`);
    else break;
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
    print(
      `Actual cost of ${it} (${currentPrice}) is cheaper than effective cost (${maxPrice})`,
      "green"
    );
  } else {
    print(
      `Actual cost of ${it} (${currentPrice}) is more expensive than effective cost (${maxPrice})`,
      "orange"
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
    property.getNumber("_stenchJellyChargeTarget"),
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
  else if (!get("sleazeAirportAlways") && !get("_sleazeAirportToday")) return;
  // Consider only allowing yachtzee chain to be run if
  // 1) globalOptions.ascending
  // 2) haveEffect($effect`Synthesis: Greed`) - 100 > myAdventures() + (fullnessLimit() - myFullness()) * 6.5 + (inebrietyLimit() - myInebriety()) * 7.5;
  // This is likely the most optimal configuration for everyone, since we would otherwise
  // have high demand for jellies using less optimal configurations, leading to decreased profits for everyone

  meatMood(false).execute(estimatedTurns());
  potionSetup(false);
  useFamiliar($familiar`Urchin Urchin`);
  maximize("meat", false);

  cliExecute(`closet put ${myMeat() - 3000000} meat`);
  if (!yachtzeeChainDiet()) {
    cliExecute(`closet take ${myClosetMeat()} meat`);
    return;
  }
  yachtzeeChainBuffs();
  cliExecute(`closet take ${myClosetMeat()} meat`);
  safeRestore();

  let jellyTurns = property.getNumber("_stenchJellyChargeTarget");
  let fishyTurns = haveEffect($effect`Fishy`);
  let plantCrookweed = true;
  set("choiceAdventure918", 2);
  while (Math.min(jellyTurns, fishyTurns) > 0) {
    executeNextDietStep();
    if (!property.getBoolean("stenchJellyUsed")) throw "We did not use stench jellies";
    adv1($location`The Sunken Party Yacht`, -1, "");
    if (haveEffect($effect`Fishy`) < fishyTurns) {
      fishyTurns -= 1;
      jellyTurns -= 1;
      set("_stenchJellyChargeTarget", property.getNumber("_stenchJellyChargeTarget") - 1);
      set("stenchJellyUsed", false);
    }
    if (
      plantCrookweed &&
      visitUrl("forestvillage.php").includes("friarcottage.gif") &&
      !get("_floristPlantsUsed").split(",").includes("Crookweed")
    ) {
      cliExecute("florist plant Crookweed");
    }
    plantCrookweed = false;
  }
  set("choiceAdventure918", "");
}

export function yachtzeeChain(): void {
  if (!globalOptions.yachtzeeChain) return;
  else if (get("_garboYachtzeeChainCompleted")) return;
  print("Running Yachtzee Chain", "purple");
  _yachtzeeChain();
  set("_garboYachtzeeChainCompleted", true);
  if (!globalOptions.noDiet) {
    runDiet();
    prepFamiliars(); // Recompute robo drinks' worth after diet is finally consumed
  }
}
