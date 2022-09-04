import {
  chew,
  cliExecute,
  drink,
  eat,
  fullnessLimit,
  haveEffect,
  inebrietyLimit,
  itemAmount,
  mallPrice,
  myFullness,
  myInebriety,
  mySpleenUse,
  numericModifier,
  print,
  retrievePrice,
  spleenLimit,
  toInt,
  use,
  useSkill,
  visitUrl,
} from "kolmafia";
import {
  $effect,
  $item,
  $skill,
  clamp,
  get,
  getActiveSongs,
  getAverageAdventures,
  have,
  set,
} from "libram";
import { acquire } from "../acquire";
import { estimatedTurns } from "../embezzler";
import { hasMonsterReplacers } from "../extrovermectin";
import { globalOptions } from "../lib";
import { garboValue } from "../session";
import synthesize from "../synthesis";
import { yachtzeePotionSetup } from "./buffs";
import { optimizeForFishy } from "./fishy";
import { freeNCs, pyecAvailable, shrugIrrelevantSongs, useSpikolodonSpikes } from "./lib";

class YachtzeeDietEntry<T> {
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

function ensureConsumable(
  name: string,
  n: number,
  fullness: number,
  inebriety: number,
  spleenUse: number
): void {
  if (myFullness() + n * fullness > fullnessLimit()) {
    throw new Error(`Eating ${n} ${name} exceeds our stomach capacity!`);
  } else if (myInebriety() + n * inebriety > inebrietyLimit()) {
    throw new Error(`Drinking ${n} ${name} exceeds our liver capacity!`);
  } else if (mySpleenUse() + n * spleenUse > spleenLimit()) {
    throw new Error(`Using ${n} ${name} exceeds our spleen capacity!`);
  }
}

class YachtzeeDietUtils {
  dietArray: Array<YachtzeeDietEntry<void>>;
  pref: string;
  originalPref: string;

  constructor(action?: (n: number, name?: string) => void) {
    this.originalPref = !get("_garboYachtzeeChainDiet") ? "" : get("_garboYachtzeeChainDiet");
    this.pref = "";
    this.dietArray = [
      new YachtzeeDietEntry("extra-greasy slider", 0, 5, 0, -5, (n: number) => {
        ensureConsumable("extra-greasy slider", n, 5, 0, -5);
        eat(n, $item`extra-greasy slider`);
      }),
      new YachtzeeDietEntry("jar of fermented pickle juice", 0, 0, 5, -5, (n: number) => {
        ensureConsumable("jar of fermented pickle juice", n, 0, 5, -5);
        castOde(5 * n);
        drink(n, $item`jar of fermented pickle juice`);
      }),
      new YachtzeeDietEntry("Extrovermectin™", 0, 0, 0, 2, (n: number) => {
        ensureConsumable("Extrovermectin™", n, 0, 0, 2);
        chew(n, $item`Extrovermectin™`);
      }),
      new YachtzeeDietEntry("synthesis", 0, 0, 0, 1, (n: number) => {
        ensureConsumable("synthesis", n, 0, 0, 1);
        synthesize(n, $effect`Synthesis: Greed`);
      }),
      new YachtzeeDietEntry("mojo filter", 0, 0, 0, -1, (n: number) => {
        use(n, $item`mojo filter`);
      }),
      new YachtzeeDietEntry("beggin' cologne", 0, 0, 0, 1, (n: number) => {
        ensureConsumable("beggin' cologne", n, 0, 0, 1);
        chew(n, $item`beggin' cologne`);
      }),
      new YachtzeeDietEntry("stench jelly", 0, 0, 0, 1, (n: number) => {
        ensureConsumable("stench jelly", n, 0, 0, 1);
        chew(n, $item`stench jelly`);
      }),
      new YachtzeeDietEntry("toast with stench jelly", 0, 1, 0, 0, (n: number) => {
        ensureConsumable("toast with stench jelly", n, 1, 0, 0);
        const VOA = get("valueOfAdventure");
        if (garboValue($item`munchies pill`) < 2.66 * VOA) {
          acquire(n, $item`munchies pill`, 2.66 * VOA, false); // We should have already acquired this earlier (this is just a failsafe)
          use(Math.min(n, itemAmount($item`munchies pill`)), $item`munchies pill`);
        }
        eat(n, $item`toast with stench jelly`);
      }),
      new YachtzeeDietEntry("jumping horseradish", 0, 1, 0, 0, (n: number) => {
        ensureConsumable("jumping horseradish", n, 1, 0, 0);
        eat(n, $item`jumping horseradish`);
      }),
      new YachtzeeDietEntry("clara's bell", 0, 0, 0, 0, () => use($item`Clara's bell`)),
      new YachtzeeDietEntry("jurassic parka", 0, 0, 0, 0, useSpikolodonSpikes),
    ];
    if (action) this.dietArray.forEach((entry) => (entry.action = action));
  }

  public setDietEntry(
    name: string,
    qty?: number,
    action?: (n: number, name?: string) => void
  ): void {
    this.dietArray.forEach((entry) => {
      if (entry.name === name) {
        if (qty) entry.quantity = qty;
        if (action) entry.action = action;
      }
    });
  }

  public resetDietPref(): void {
    this.originalPref = "";
    this.pref = "";
  }

  public addToPref(n: number, name?: string): void {
    if (!name) throw new Error("Diet pref must have a name");
    for (let i = 0; i < n; i++) {
      this.pref = this.pref.concat(name ?? "").concat(",");
    }
  }

  public setDietPref(): void {
    set("_garboYachtzeeChainDiet", this.originalPref.concat(this.pref));
  }
}

function splitDietEntry(entry: YachtzeeDietEntry<void>): Array<YachtzeeDietEntry<void>> {
  const entries = new Array<YachtzeeDietEntry<void>>();
  for (let i = 0; i < entry.quantity; i++) {
    entries.push(
      new YachtzeeDietEntry(
        entry.name,
        1,
        entry.fullness,
        entry.drunkenness,
        entry.spleen,
        entry.action
      )
    );
  }
  return entries;
}

function combineDietEntries(
  left: YachtzeeDietEntry<void>,
  right: YachtzeeDietEntry<void>
): YachtzeeDietEntry<void> {
  return new YachtzeeDietEntry(
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

  shrugIrrelevantSongs();

  // If we have the polka of plenty skill, we can re-buff up later
  // Else, get rid of chorale which is the most inefficient song
  if (getActiveSongs.length === (have($skill`Mariachi Memory`) ? 4 : 3)) {
    if (have($skill`The Polka of Plenty`)) cliExecute(`shrug ${$effect`Polka of Plenty`}`);
    else cliExecute(`shrug ${$effect`Chorale of Companionship`}`);
  }

  while (haveEffect($effect`Ode to Booze`) < turns) {
    useSkill($skill`The Ode to Booze`);
  }
  return true;
}

export function executeNextDietStep(stopBeforeJellies?: boolean): void {
  if (get("_stenchJellyUsed", false)) return;
  print("Executing next diet steps", "blue");
  const dietUtil = new YachtzeeDietUtils();
  dietUtil.resetDietPref();
  const VOA = get("valueOfAdventure");

  const dietString = get("_garboYachtzeeChainDiet").split(",");
  let stenchJellyConsumed = false;
  for (const name of dietString) {
    if (name.length === 0) continue;
    else if (
      (!stenchJellyConsumed && name.includes("stench jelly")) ||
      ["clara's bell", "jurassic parka"].includes(name)
    ) {
      if (stopBeforeJellies) dietUtil.addToPref(1, name);
      else {
        const entry = dietUtil.dietArray.find((entry) => entry.name === name);
        if (entry) {
          if (entry.fullness > 0) {
            if (!get("_milkOfMagnesiumUsed")) {
              acquire(1, $item`milk of magnesium`, 5 * VOA);
              use(1, $item`milk of magnesium`);
            }
            if (!get("_distentionPillUsed") && have($item`distention pill`)) {
              use(1, $item`distention pill`);
            }
          }
          entry.action(1);
        } else {
          throw new Error(`Could not find ${name} in dietArray`);
        }
        set("_stenchJellyUsed", true);
      }
      stenchJellyConsumed = true;
    } else if (!stenchJellyConsumed) {
      dietUtil.dietArray.forEach((entry) => {
        if (entry.name === name) {
          if (myFullness() + entry.fullness > fullnessLimit()) {
            throw new Error(`consuming ${entry.name} will exceed our fullness limit`);
          } else if (myInebriety() + entry.drunkenness > inebrietyLimit()) {
            throw new Error(`consuming ${entry.name} will exceed our inebriety limit`);
          } else if (mySpleenUse() + entry.spleen > spleenLimit()) {
            throw new Error(`consuming ${entry.name} will exceed our spleen limit`);
          }
          if (entry.fullness > 0) {
            if (!get("_milkOfMagnesiumUsed")) {
              acquire(1, $item`milk of magnesium`, 5 * VOA);
              use(1, $item`milk of magnesium`);
            }
            if (!get("_distentionPillUsed") && have($item`distention pill`)) {
              use(1, $item`distention pill`);
            }
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
    throw new Error("We completed our entire diet but failed to get a stench jelly charge");
  }
}

function yachtzeeDietScheduler(
  menu: Array<YachtzeeDietEntry<void>>
): Array<YachtzeeDietEntry<void>> {
  const dietSchedule = new Array<YachtzeeDietEntry<void>>();
  const remainingMenu = new Array<YachtzeeDietEntry<void>>();
  const jellies = new Array<YachtzeeDietEntry<void>>();
  const haveDistentionPill = !get("_distentionPillUsed") && have($item`distention pill`);
  const toasts = new Array<YachtzeeDietEntry<void>>();
  const freeNCs = new Array<YachtzeeDietEntry<void>>();

  // We assume the menu was constructed such that we will not overshoot our fullness and inebriety limits
  // Assume all fullness/drunkenness > 0 non-spleen cleansers are inserted for buffs
  // This makes it trivial to plan the diet
  // First, lay out all the spleen cleansers (and the buff consumables at the front)
  for (const entry of menu) {
    if (entry.spleen < 0) {
      for (const splitEntry of splitDietEntry(entry)) dietSchedule.push(splitEntry);
    } else if (entry.name === "stench jelly") {
      for (const splitEntry of splitDietEntry(entry)) jellies.push(splitEntry);
    } else if (entry.name === "toast with stench jelly") {
      for (const splitEntry of splitDietEntry(entry)) toasts.push(splitEntry);
    } else if (["clara's bell", "jurassic parka"].includes(entry.name)) {
      for (const splitEntry of splitDietEntry(entry)) freeNCs.push(splitEntry);
    } else if (entry.fullness > 0 || entry.drunkenness > 0) {
      for (const splitEntry of splitDietEntry(entry)) dietSchedule.splice(0, 0, splitEntry);
    } else {
      for (const splitEntry of splitDietEntry(entry)) remainingMenu.push(splitEntry);
    }
  }

  // Place toasts at the back of our schedule
  for (const toast of toasts) {
    dietSchedule.push(toast);
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

  // Next, put our free NC sources at the end of the diet
  for (const freeNCSource of freeNCs) dietSchedule.push(freeNCSource);

  // Next, combine clustered entries where possible (this is purely for aesthetic reasons)
  let idx = 0;
  while (idx < dietSchedule.length - 1) {
    if (dietSchedule[idx].name === dietSchedule[idx + 1].name) {
      dietSchedule.splice(idx, 2, combineDietEntries(dietSchedule[idx], dietSchedule[idx + 1]));
    } else idx++;
  }

  // Print diet schedule
  print(`Fullness:    ${myFullness()}/${fullnessLimit() + toInt(haveDistentionPill)}`, "blue");
  print(`Drunkenness: ${myInebriety()}/${inebrietyLimit()}`, "blue");
  print(`Spleen Use:  ${mySpleenUse()}/${spleenLimit()}`, "blue");
  print("Diet schedule:", "blue");
  for (const entry of dietSchedule) print(`Use ${entry.quantity} ${entry.name}`, "blue");

  // Finally, run a check to ensure everything is fine
  let fullness = myFullness();
  let drunkenness = myInebriety();
  let spleenUse = mySpleenUse();
  for (const entry of dietSchedule) {
    fullness += entry.quantity * entry.fullness;
    drunkenness += entry.quantity * entry.drunkenness;
    spleenUse += entry.quantity * entry.spleen;
    if (fullness > fullnessLimit() + toInt(haveDistentionPill)) {
      throw new Error(
        `Error in diet schedule: Overeating ${entry.quantity} ${entry.name} to ${fullness}/${
          fullnessLimit() + toInt(haveDistentionPill)
        }`
      );
    } else if (drunkenness > inebrietyLimit()) {
      throw new Error(
        `Error in diet schedule: Overdrinking ${entry.quantity} ${
          entry.name
        } to ${drunkenness}/${inebrietyLimit()}`
      );
    } else if (spleenUse > spleenLimit()) {
      throw new Error(
        `Error in diet schedule: Overspleening ${entry.quantity} ${
          entry.name
        } to ${spleenUse}/${spleenLimit()}`
      );
    }
  }

  return dietSchedule;
}

export function yachtzeeChainDiet(simOnly?: boolean): boolean {
  if (get("_garboYachtzeeChainDietPlanned", false)) return true;

  const havePYECCharge = pyecAvailable();
  const haveDistentionPill = !get("_distentionPillUsed") && have($item`distention pill`);
  const haveDogHairPill = !get("_syntheticDogHairPillUsed") && have($item`synthetic dog hair pill`);

  const currentSpleenLeft = spleenLimit() - mySpleenUse();
  const filters = 3 - get("currentMojoFilters");
  // save some spleen the first two extro, which are worth a lot
  // due to macrometeor and cheat code: replace enemy
  const extroSpleenSpace = hasMonsterReplacers()
    ? 4 - Math.min(4, 2 * get("beGregariousCharges"))
    : 0;
  const synthCastsToCoverRun =
    globalOptions.noBarf || !have($skill`Sweet Synthesis`)
      ? 0
      : Math.max(0, Math.round((estimatedTurns() - haveEffect($effect`Synthesis: Greed`)) / 30));
  const fullnessAvailable = fullnessLimit() - myFullness() + toInt(haveDistentionPill);
  const inebrietyAvailable =
    inebrietyLimit() -
    myInebriety() +
    toInt(haveDogHairPill) +
    (3 - get("_sweatOutSomeBoozeUsed", 0));
  const spleenAvailable = currentSpleenLeft + filters;
  const organsAvailable = fullnessAvailable + inebrietyAvailable + spleenAvailable;

  const cleanableSpleen = organsAvailable - synthCastsToCoverRun - extroSpleenSpace;
  const sufficientOrgansFor = (yachtzees: number) =>
    cleanableSpleen >= yachtzees + (havePYECCharge ? 5 : 0);

  const possibleBaseYachtzeeTurns = [30, 20, 10];
  const baseYachtzeeTurns = possibleBaseYachtzeeTurns.find(sufficientOrgansFor) ?? 0;

  if (baseYachtzeeTurns === 0) {
    print("Determined that there are no suitable number of turns to chain yachtzees", "red");
    return false;
  }

  const maxYachtzeeTurns = havePYECCharge ? baseYachtzeeTurns + 5 : baseYachtzeeTurns;
  print(`Synth Casts Wanted: ${synthCastsToCoverRun}`, "blue");
  print(`Organs Available: ${organsAvailable}`, "blue");
  print(`Max Yachtzee Turns: ${maxYachtzeeTurns}`, "blue");

  // Plan our diet

  const sliders = Math.floor((fullnessLimit() + toInt(haveDistentionPill) - myFullness()) / 5);
  const pickleJuice = Math.floor((inebrietyLimit() - myInebriety()) / 5);

  const reqSynthTurns = 30; // We will be left with max(0, 30 - yachtzeeTurns) after chaining
  const synthTurnsWanted = reqSynthTurns - haveEffect($effect`Synthesis: Greed`);
  const synthCastsWanted = Math.ceil(synthTurnsWanted / 30);
  const synthCasts = have($skill`Sweet Synthesis`) ? Math.max(synthCastsWanted, 0) : 0;

  let cologne = 0;

  const potentialSpleen = currentSpleenLeft + 5 * sliders + 5 * pickleJuice + filters;
  const availableSpleen = potentialSpleen - synthCasts - extroSpleenSpace; // Spleen available for ingesting jellies

  set("_stenchJellyChargeTarget", 0);

  if (availableSpleen + freeNCs() < baseYachtzeeTurns) {
    print("We were unable to generate enough organ space for optimal yachtzee chaining", "red");
    return false;
  }

  const yachtzeeTurns = availableSpleen >= maxYachtzeeTurns ? maxYachtzeeTurns : baseYachtzeeTurns;
  if (availableSpleen + freeNCs() > yachtzeeTurns) cologne = 1; // If we have excess spleen, chew a cologne (representing -1 to availableSpleen, but we no longer need that variable)

  if (simOnly) print(`We can potentially run ${yachtzeeTurns} for yachtzee`, "purple");
  else print(`Trying to run ${yachtzeeTurns} turns of Yachtzee`, "purple");

  // Compute prices to make sure everything is worth it
  const fishyCost = optimizeForFishy(yachtzeeTurns);
  const extroPrice = mallPrice($item`Extrovermectin™`);
  const VOA = get("valueOfAdventure");
  const slidersPrice = mallPrice($item`extra-greasy slider`);
  const pickleJuicePrice = mallPrice($item`jar of fermented pickle juice`);
  const colognePrice = mallPrice($item`beggin' cologne`);

  // We prefer using pickle juice to cleanse our spleen for stench jellies since
  // 1) It's cheaper
  // 2) Our stomach can be used for horseradish buffs
  const spleenNeeded =
    Math.max(0, yachtzeeTurns - freeNCs()) + synthCasts + extroSpleenSpace + cologne;
  const spleenToClean = spleenNeeded - currentSpleenLeft - filters;

  let pickleJuiceToDrink = clamp(Math.ceil(spleenToClean / 5), 0, pickleJuice);
  let slidersToEat = clamp(Math.ceil(spleenToClean / 5) - pickleJuiceToDrink, 0, sliders);
  let jelliesToChew = Math.max(0, yachtzeeTurns - freeNCs());

  const extrosToChew = extroSpleenSpace / 2;
  const synthToUse = synthCasts;
  const cologneToChew = cologne;

  // Compare jellies + sliders vs toasts
  const jellyPrice = mallPrice($item`stench jelly`);
  const jellySlidersCosts = jellyPrice + slidersPrice / 5;
  const jellyPickleCosts = jellyPrice + pickleJuicePrice / 5;
  const toastPrice = Math.min(
    mallPrice($item`toast with stench jelly`),
    jellyPrice + mallPrice($item`toast`)
  );

  const sliderAdventuresPerFull = getAverageAdventures($item`extra-greasy slider`) / 5;
  const toastAdventuresPerFull = getAverageAdventures($item`toast with stench jelly`) / 1;
  const toastOpportunityCost =
    toastPrice + (sliderAdventuresPerFull - toastAdventuresPerFull) * VOA;

  let toastsToEat = 0;
  if (toastOpportunityCost < jellySlidersCosts) {
    toastsToEat = 5 * slidersToEat;
    jelliesToChew -= 5 * slidersToEat;
    slidersToEat = 0;
  }

  if (toastOpportunityCost < jellyPickleCosts) {
    while (
      pickleJuiceToDrink > 0 &&
      jelliesToChew >= 5 &&
      myFullness() + slidersToEat * 5 + toastsToEat + 5 <=
        fullnessLimit() + (haveDistentionPill ? 1 : 0) - 1
    ) {
      toastsToEat += 5;
      jelliesToChew -= 5;
      pickleJuiceToDrink -= 1;
    }
  }

  const jelliesBulkPrice = retrievePrice($item`stench jelly`, jelliesToChew);

  // If we need spleen cleansers but their prices are unreasonable, just return
  const maxSliderPrice = 150000,
    maxPickleJuicePrice = 150000;
  if (slidersToEat > 0 && mallPrice($item`extra-greasy slider`) > maxSliderPrice) {
    print("Sliders are way too overpriced for us to clean spleens for jellies", "red");
    return false;
  } else if (
    pickleJuiceToDrink > 0 &&
    mallPrice($item`jar of fermented pickle juice`) > maxPickleJuicePrice
  ) {
    print("Pickle juices are way too overpriced for us to clean spleens for jellies", "red");
    return false;
  }

  const horseradishes =
    haveEffect($effect`Kicked in the Sinuses`) < baseYachtzeeTurns &&
    myFullness() + 1 + slidersToEat * 5 + toastsToEat <= fullnessLimit() + toInt(haveDistentionPill)
      ? 1
      : 0;

  const earlyMeatDropsEstimate =
    numericModifier("Meat Drop") +
    (!have($effect`Synthesis: Greed`) && have($skill`Sweet Synthesis`) ? 300 : 0) +
    (visitUrl("forestvillage.php").includes("friarcottage.gif") ? 60 : 0);

  // Some iffy calculations here
  // If the best diet (at current prices) includes sliders and pickle juice (s+pj), no issues there
  // However, if the best diet does not include s+pj, then we need to compute the loss of switching
  // from the best diet to s+pj, and add it to our jellyValuePerSpleen calculations
  // Let's just say (for now) that sliders are at best worth 70k and pickle juices are worth 60k
  const slidersExcessCost = slidersPrice > 70000 ? slidersPrice - 70000 : 0;
  const pickleJuiceExcessCost = pickleJuicePrice > 60000 ? pickleJuicePrice - 60000 : 0;

  // Yachtzee has higher base meat than KGEs
  // thus some potions which aren't profitable for KGEs are profitable for yachtzees
  // Prior to entering this function, we should already have triggered potionSetup()
  // This means that any further buffs are purely profitable only for yachtzees
  // If running simOnly, there's a possibility that potionSetup() hasn't been run
  // However, this means that higherBaseMeatProfits would try to account for the lower earlyMeatDropsEstimate
  const higherBaseMeatProfits =
    yachtzeePotionSetup(yachtzeeTurns, true) +
    cologneToChew * ((yachtzeeTurns + 60 + 5 * toInt(havePYECCharge)) * 1000 - colognePrice) +
    (horseradishes > 0 ? yachtzeeTurns * 1000 : 0);

  // We assume that the embezzlers after yachtzee chaining would still benefit from our start-of-day buffs
  // so the assumption is that all the gregged embezzlies can be approximated as marginal KGEs with profits of 3 * VOA
  const extroValuePerSpleen = 6 * VOA - extroPrice / 2;
  const jellyValuePerSpleen =
    (earlyMeatDropsEstimate * 2000) / 100 -
    (jelliesBulkPrice +
      toastsToEat * toastPrice +
      fishyCost +
      slidersToEat * slidersExcessCost +
      pickleJuiceToDrink * pickleJuiceExcessCost -
      higherBaseMeatProfits) /
      yachtzeeTurns;

  print(`Early Meat Drop Modifier: ${earlyMeatDropsEstimate}%`);
  print(`Extro value per spleen: ${extroValuePerSpleen}`);
  print(`Jelly value per spleen: ${jellyValuePerSpleen}`);
  if (simOnly) {
    print(
      `Jelly value estimates are wildly off for simulations because we have not properly buffed up yet`,
      "orange"
    );
  }
  if (jellyValuePerSpleen < extroValuePerSpleen && !simOnly) {
    print("Running extros is more profitable than chaining yachtzees", "red");
    return false; // We should do extros instead since they are more valuable
  }

  // Schedule our diet first

  const addPref = (n: number, name?: string) => {
    dietUtil.addToPref(n, name);
  };
  const dietUtil = new YachtzeeDietUtils(addPref);
  const regularEntries: [string, number][] = [
    ["extra-greasy slider", slidersToEat],
    ["jar of fermented pickle juice", pickleJuiceToDrink],
    ["Extrovermectin™", extrosToChew],
    ["synthesis", synthToUse],
    ["mojo filter", filters],
    ["beggin' cologne", cologneToChew],
    ["jumping horseradish", horseradishes],
  ];

  const specialEntries: [string, number, (n: number, name?: string) => void][] = (
    [
      ["stench jelly", jelliesToChew],
      ["toast with stench jelly", toastsToEat],
      ["clara's bell", have($item`Clara's bell`) && !globalOptions.clarasBellClaimed ? 1 : 0],
      ["jurassic parka", have($item`Jurassic Parka`) ? get("_spikolodonSpikeUses") : 0],
    ] as [string, number][]
  ).map(([name, qty]) => [
    name,
    qty,
    (n: number, name?: string) => {
      dietUtil.addToPref(n, name);
      if (!simOnly) {
        set("_stenchJellyChargeTarget", get("_stenchJellyChargeTarget", 0) + n);
      }
    },
  ]);

  for (const entry of regularEntries) dietUtil.setDietEntry(...entry);
  for (const entry of specialEntries) dietUtil.setDietEntry(...entry);

  // Run diet scheduler
  print("Scheduling diet", "purple");
  const dietSchedule = yachtzeeDietScheduler(dietUtil.dietArray);

  // Now execute the diet
  for (const entry of dietSchedule) entry.action(entry.quantity, entry.name);
  dietUtil.setDietPref();

  if (simOnly) return true;

  if (get("_stenchJellyChargeTarget", 0) < yachtzeeTurns) {
    throw new Error(
      `We are only able to obtain up to ${get(
        "_stenchJellyChargeTarget",
        0
      )}/${yachtzeeTurns} turns of jelly charges!`
    );
  }

  // Acquire everything we need
  acquire(
    jelliesToChew,
    $item`stench jelly`,
    (2 * jelliesBulkPrice) / jelliesToChew,
    true,
    1.2 * jelliesBulkPrice // Bulk jelly purchases may cost > 1m in the future
  );
  acquire(
    toastsToEat,
    $item`toast with stench jelly`,
    2 * toastPrice,
    true,
    1.2 * toastPrice * toastsToEat
  );
  acquire(toastsToEat, $item`munchies pill`, 2.66 * VOA, false);
  acquire(extrosToChew, $item`Extrovermectin™`, 100000);
  acquire(pickleJuiceToDrink, $item`jar of fermented pickle juice`, maxPickleJuicePrice);
  acquire(slidersToEat, $item`extra-greasy slider`, maxSliderPrice);
  acquire(cologneToChew, $item`beggin' cologne`, 2 * colognePrice);
  acquire(filters, $item`mojo filter`, 2 * mallPrice($item`mojo filter`));
  acquire(horseradishes, $item`jumping horseradish`, 60000);

  // Get fishy turns
  print("Getting fishy turns", "purple");
  optimizeForFishy(yachtzeeTurns, true);

  // Final checks
  if (haveEffect($effect`Fishy`) + 5 * toInt(havePYECCharge) < yachtzeeTurns) {
    throw new Error(`We only got ${haveEffect($effect`Fishy`)}/${yachtzeeTurns} turns of fishy!`);
  }

  set("_garboYachtzeeChainDietPlanned", true);
  return true;
}
