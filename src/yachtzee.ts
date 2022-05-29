import {
  adv1,
  canInteract,
  chew,
  cliExecute,
  drink,
  eat,
  Effect,
  fullnessLimit,
  haveEffect,
  inebrietyLimit,
  maximize,
  myClosetMeat,
  myFullness,
  myInebriety,
  myLevel,
  myMeat,
  mySpleenUse,
  myTurncount,
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
  $location,
  $skill,
  clamp,
  get,
  getActiveEffects,
  getActiveSongs,
  have,
  isSong,
  Mood,
  property,
  set,
  sum,
} from "libram";
import { acquire } from "./acquire";
import { prepFamiliars } from "./dailies";
import { runDiet } from "./diet";
import { EmbezzlerFight, embezzlerSources, estimatedTurns } from "./embezzler";
import { hasMonsterReplacers } from "./extrovermectin";
import { baseMeat, globalOptions, safeRestore, turnsToNC } from "./lib";
import { meatMood } from "./mood";
import { farmingPotions, mutuallyExclusive, Potion, potionSetup } from "./potions";
import { garboValue } from "./session";
import synthesize from "./synthesis";

class DietEntry<T> {
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

class DietUtils {
  dietArray: Array<DietEntry<void>>;
  pref: string;
  originalPref: string;

  constructor(action?: (n: number, name?: string) => void) {
    this.originalPref = !get("_garboYachtzeeChainDiet")
      ? ""
      : property.getString("_garboYachtzeeChainDiet");
    this.pref = "";
    this.dietArray = [
      new DietEntry(`extra-greasy slider`, 0, 5, 0, -5, (n: number) => {
        eat(n, $item`extra-greasy slider`);
      }),
      new DietEntry(`jar of fermented pickle juice`, 0, 0, 5, -5, (n: number) => {
        castOde(5 * n);
        drink(n, $item`jar of fermented pickle juice`);
      }),
      new DietEntry(`Extrovermectin™`, 0, 0, 0, 2, (n: number) => {
        chew(n, $item`Extrovermectin™`);
      }),
      new DietEntry("synthesis", 0, 0, 0, 1, (n: number) => {
        synthesize(n, $effect`Synthesis: Greed`);
      }),
      new DietEntry(`mojo filter`, 0, 0, 0, -1, (n: number) => {
        use(n, $item`mojo filter`);
      }),
      new DietEntry(`beggin' cologne`, 0, 0, 0, 1, (n: number) => {
        chew(n, $item`beggin' cologne`);
      }),
      new DietEntry(`stench jelly`, 0, 0, 0, 1, (n: number) => {
        chew(n, $item`stench jelly`);
      }),
      new DietEntry(`jumping horseradish`, 0, 1, 0, 0, (n: number) => {
        eat(n, $item`jumping horseradish`);
      }),
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
    if (!name) throw "Diet pref must have a name";
    for (let i = 0; i < n; i++) {
      this.pref = this.pref.concat(name ?? "").concat(",");
    }
  }

  public setDietPref(): void {
    set("_garboYachtzeeChainDiet", this.originalPref.concat(this.pref));
  }
}

function splitDietEntry(entry: DietEntry<void>): Array<DietEntry<void>> {
  const entries = new Array<DietEntry<void>>();
  for (let i = 0; i < entry.quantity; i++) {
    entries.push(
      new DietEntry(entry.name, 1, entry.fullness, entry.drunkenness, entry.spleen, entry.action)
    );
  }
  return entries;
}

function combineDietEntries(left: DietEntry<void>, right: DietEntry<void>): DietEntry<void> {
  return new DietEntry(
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

function executeNextDietStep(stopBeforeJellies?: boolean): void {
  if (property.getBoolean("stenchJellyUsed")) return;
  print("Executing next diet steps", "blue");
  const dietUtil = new DietUtils();
  dietUtil.resetDietPref();

  const dietString = property.getString("_garboYachtzeeChainDiet").split(",");
  let stenchJellyConsumed = false;
  for (const name of dietString) {
    if (name.length === 0) continue;
    else if (!stenchJellyConsumed && name === "stench jelly") {
      if (stopBeforeJellies) dietUtil.addToPref(1, name);
      else {
        chew(1, $item`stench jelly`);
        set("stenchJellyUsed", true);
      }
      stenchJellyConsumed = true;
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
          if (entry.fullness > 0) {
            if (!property.getBoolean("_milkOfMagnesiumUsed")) {
              acquire(1, $item`milk of magnesium`, 10000);
              use(1, $item`milk of magnesium`);
            }
            if (!property.getBoolean("_distentionPillUsed") && have($item`distention pill`)) {
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
    throw "We completed our entire diet but failed to get a stench jelly charge";
  }
}

function yachtzeeDietScheduler(menu: Array<DietEntry<void>>): Array<DietEntry<void>> {
  const dietSchedule = new Array<DietEntry<void>>();
  const remainingMenu = new Array<DietEntry<void>>();
  const jellies = new Array<DietEntry<void>>();
  // We assume the menu was constructed such that we will not overshoot our fullness and inebriety limits
  // Assume all fullness/drunkenness > 0 non-spleen cleansers are inserted for buffs
  // This makes it trivial to plan the diet
  // First, lay out all the spleen cleansers
  for (const entry of menu) {
    if (entry.spleen < 0) {
      for (const splitEntry of splitDietEntry(entry)) dietSchedule.push(splitEntry);
    } else if (entry.name === "stench jelly") {
      for (const splitEntry of splitDietEntry(entry)) jellies.push(splitEntry);
    } else if (entry.fullness > 0 || entry.drunkenness > 0) {
      for (const splitEntry of splitDietEntry(entry)) dietSchedule.splice(0, 0, splitEntry);
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
  if (property.getBoolean("_garboYachtzeeChainDietPlanned")) return true;

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

  if (simOnly) print(`We can potentially run ${yachtzeeTurns} for yachtzee`, "purple");
  else print(`Trying to run ${yachtzeeTurns} turns of Yachtzee`, "purple");

  // Compute prices to make sure everything is worth it
  const fishJuiceBoxPrice = garboValue($item`fish juice box`);
  const jelliesBulkPrice = retrievePrice($item`stench jelly`, yachtzeeTurns);
  const extroPrice = garboValue($item`Extrovermectin™`);
  const VOA = get("valueOfAdventure");
  const slidersPrice = garboValue($item`extra-greasy slider`);
  const pickleJuicePrice = garboValue($item`jar of fermented pickle juice`);
  const colognePrice = garboValue($item`beggin' cologne`);

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
  if (slidersToEat > 0 && garboValue($item`extra-greasy slider`) > maxSliderPrice) {
    print("Sliders are way too overpriced for us to clean spleens for jellies", "red");
    return false;
  } else if (
    pickleJuiceToDrink > 0 &&
    garboValue($item`jar of fermented pickle juice`) > maxPickleJuicePrice
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

  // Yachtzee has higher base meat than KGEs
  // thus some potions which aren't profitable for KGEs are profitable for yachtzees
  // Prior to entering this function, we should already have triggered potionSetup()
  // This means that any further buffs are purely profitable only for yachtzees
  // If running simOnly, there's a possibility that potionSetup() hasn't been run
  // However, this means that higherBaseMeatProfits would try to account for the lower earlyMeatDropsEstimate
  const higherBaseMeatProfits = yachtzeePotionSetup(yachtzeeTurns, true);

  // We assume that the embezzlers after yachtzee chaining would still benefit from our start-of-day buffs
  // so the assumption is that all the gregged embezzlies can be approximated as marginal KGEs with profits of 3.5 * VOA
  const extroValuePerSpleen = 7 * VOA - extroPrice / 2;
  const jellyValuePerSpleen =
    (earlyMeatDropsEstimate * 2000) / 100 -
    (jelliesBulkPrice +
      fishJuiceBoxPrice +
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
  const cologne =
    availableSpleen >= yachtzeeTurns + 1 &&
    haveEffect($effect`Eau d' Clochard`) < yachtzeeTurns &&
    colognePrice < yachtzeeTurns * 2000 + (60 - yachtzeeTurns) * (baseMeat + 750)
      ? 1
      : 0;
  if (cologne > 0) availableSpleen -= 1;

  const horseradishes =
    haveEffect($effect`Kicked in the Sinuses`) < 30 && myFullness() + 1 + sliders < fullnessLimit()
      ? 1
      : 0;

  const addPref = (n: number, name?: string) => {
    dietUtil.addToPref(n, name);
  };
  const dietUtil = new DietUtils(addPref);
  dietUtil.resetDietPref();
  dietUtil.setDietEntry(`extra-greasy slider`, slidersToEat);
  dietUtil.setDietEntry(`jar of fermented pickle juice`, pickleJuiceToDrink);
  dietUtil.setDietEntry(`Extrovermectin™`, extrosToChew);
  dietUtil.setDietEntry(`synthesis`, synthToUse);
  dietUtil.setDietEntry(`mojo filter`, filters);
  dietUtil.setDietEntry(`beggin' cologne`, cologne);
  dietUtil.setDietEntry(`jumping horseradish`, horseradishes);
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
    acquire(extrosToChew, $item`Extrovermectin™`, 100000, true);
  }
  if (pickleJuiceToDrink > 0) {
    acquire(pickleJuiceToDrink, $item`jar of fermented pickle juice`, maxPickleJuicePrice, true);
  }
  if (slidersToEat > 0) acquire(slidersToEat, $item`extra-greasy slider`, maxSliderPrice, true);
  if (haveEffect($effect`Fishy`) + 20 + (havePYECCharge ? 5 : 0) < yachtzeeTurns) {
    acquire(1, $item`fish juice box`, 2 * fishJuiceBoxPrice, true);
  }
  if (cologne > 0) acquire(cologne, $item`beggin' cologne`, 2 * colognePrice, true);
  if (filters > 0) acquire(filters, $item`mojo filter`, 2 * garboValue($item`mojo filter`), true);
  if (horseradishes > 0) acquire(horseradishes, $item`jumping horseradish`, 60000, true);

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
  return true;
}

const ignoredSources = [
  "Orb Prediction",
  "Pillkeeper Semirare",
  "Lucky!",
  "11-leaf clover (untapped potential)",
];
const expectedEmbezzlers = sum(
  embezzlerSources.filter((source: EmbezzlerFight) => !ignoredSources.includes(source.name)),
  (source: EmbezzlerFight) => source.potential()
);

function yachtzeePotionProfits(potion: Potion, yachtzeeTurns: number): number {
  const effectiveYachtzeeTurns = Math.max(
    Math.min(yachtzeeTurns - haveEffect(potion.effect()), potion.effectDuration()),
    0
  );
  const embezzlerTurns = Math.min(
    expectedEmbezzlers,
    Math.max(potion.effectDuration() - effectiveYachtzeeTurns, 0)
  );
  const barfTurns = Math.max(potion.effectDuration() - effectiveYachtzeeTurns - embezzlerTurns, 0);
  const embezzlerValue = embezzlerTurns > 0 ? potion.gross(embezzlerTurns) : 0;
  const yachtzeeValue =
    (effectiveYachtzeeTurns * 2000 * (potion.meatDrop() + 2.5 * potion.familiarWeight())) / 100; // Every 1lbs of lep ~ 2.5% meat drop
  const barfValue = (barfTurns * baseMeat * turnsToNC) / (turnsToNC + 1);

  return yachtzeeValue + embezzlerValue + barfValue - potion.price(true);
}

function yachtzeePotionSetup(yachtzeeTurns: number, simOnly?: boolean): number {
  let totalProfits = 0;
  const excludedEffects = new Set<Effect>();

  if (have($item`Eight Days a Week Pill Keeper`) && !property.getBoolean("_freePillKeeperUsed")) {
    const doublingPotions = farmingPotions
      .filter(
        (potion) =>
          potion.canDouble &&
          haveEffect(potion.effect()) < yachtzeeTurns &&
          yachtzeePotionProfits(potion.doubleDuration(), yachtzeeTurns) > 0 &&
          potion.price(true) < myMeat()
      )
      .sort(
        (left, right) =>
          yachtzeePotionProfits(right.doubleDuration(), yachtzeeTurns) -
          yachtzeePotionProfits(left.doubleDuration(), yachtzeeTurns)
      );
    const bestPotion = doublingPotions.length > 0 ? doublingPotions[0].doubleDuration() : undefined;
    if (bestPotion) {
      const profit = yachtzeePotionProfits(bestPotion, yachtzeeTurns);
      const price = bestPotion.price(true);
      totalProfits += profit;
      print(`Determined that ${bestPotion.potion} was the best potion to double`, "blue");
      print(
        `Expected to profit ${profit} meat from doubling 1 ${bestPotion.potion} @ price ${price} meat}`,
        "blue"
      );
      if (!simOnly) {
        cliExecute("pillkeeper extend");
        acquire(1, bestPotion.potion, profit + price);
        bestPotion.use(1);
      } else excludedEffects.add(bestPotion.effect());
    }
  }

  for (const effect of getActiveEffects()) {
    for (const excluded of mutuallyExclusive.get(effect) ?? []) {
      excludedEffects.add(excluded);
    }
  }
  excludedEffects.add($effect`Braaaaaains`); // Doesn't seem like we can wish for this

  const testPotions = farmingPotions
    .filter(
      (potion) =>
        haveEffect(potion.effect()) < yachtzeeTurns &&
        yachtzeePotionProfits(potion, yachtzeeTurns) > 0
    )
    .sort(
      (left, right) =>
        yachtzeePotionProfits(right, yachtzeeTurns) - yachtzeePotionProfits(left, yachtzeeTurns)
    );

  for (const potion of testPotions) {
    const effect = potion.effect();
    const price = potion.price(true);
    if (haveEffect(effect) >= yachtzeeTurns || price > myMeat()) continue;
    if (!excludedEffects.has(effect)) {
      let tries = 0;
      while (haveEffect(effect) < yachtzeeTurns) {
        tries++;
        print(`Considering effect ${effect} from source ${potion.potion}`, "blue");
        const profit = yachtzeePotionProfits(potion, yachtzeeTurns);
        if (profit < 0) break;
        totalProfits += profit;
        print(
          `Expected to profit ${profit} meat from using 1 ${potion.potion} @ price ${price} meat}`,
          "blue"
        );
        if (!simOnly) {
          acquire(1, potion.potion, profit + price);
          if (!have(potion.potion)) break;
          if (isSong(effect) && !have(effect)) {
            for (const song of getActiveSongs()) {
              const slot = Mood.defaultOptions.songSlots.find((slot) => slot.includes(song));
              if (!slot || slot.includes(effect)) {
                cliExecute(`shrug ${song}`);
              }
            }
          }
          if (!potion.use(1) || tries >= 5 * Math.ceil(yachtzeeTurns / potion.effectDuration())) {
            break;
          }
        } else break;
      }
      if (haveEffect(effect) || simOnly) {
        for (const excluded of mutuallyExclusive.get(effect) ?? []) {
          excludedEffects.add(excluded);
        }
      }
    }
  }

  executeNextDietStep(true);
  if (!simOnly && have($item`Platinum Yendorian Express Card`) && !get(`expressCardUsed`)) {
    use(1, $item`Platinum Yendorian Express Card`);
  }

  // Uncle Greenspan's may be cost effective
  if (!simOnly && !have($effect`Buy!  Sell!  Buy!  Sell!`)) {
    const yachtzeeFactor = yachtzeeTurns * (yachtzeeTurns + 1);
    const embezzlerFactor =
      Math.min(100, expectedEmbezzlers + yachtzeeTurns) *
      (Math.min(100, expectedEmbezzlers + yachtzeeTurns) + 1);
    const greenspanValue =
      (2000 * yachtzeeFactor +
        (baseMeat + 750) * (embezzlerFactor - yachtzeeFactor) +
        baseMeat * (10100 - embezzlerFactor)) /
      100;
    const price = garboValue($item`Uncle Greenspan's Bathroom Finance Guide`);
    const profit = greenspanValue - price;
    if (profit > 0) {
      print(
        `Expected to profit ${profit} meat from using 1 Uncle Greenspan's Bathroom Finance Guide @ price ${price} meat}`,
        "blue"
      );
      acquire(1, $item`Uncle Greenspan's Bathroom Finance Guide`, greenspanValue);
      if (have($item`Uncle Greenspan's Bathroom Finance Guide`)) {
        use(1, $item`Uncle Greenspan's Bathroom Finance Guide`);
      }
    }
  }

  return totalProfits;
}

function _yachtzeeChain(): void {
  if (!have($item`fishy pipe`)) return;
  // hard require fishy pipe to run this chain
  else if (!have($familiar`Urchin Urchin`)) return;
  // also hard require urchin urchin for now
  else if (myLevel() <= 13 || !canInteract()) return;
  // We definitely need to be able to eat sliders and drink pickle juice
  else if (property.getBoolean("fishyPipeUsed") && !have($effect`Fishy`)) return;
  // If we have used our fishy pipe and have no fishy turns left, we're probably done
  else if (
    !property.getBoolean("sleazeAirportAlways") &&
    !property.getBoolean("_sleazeAirportToday")
  ) {
    return;
  }
  // Consider only allowing yachtzee chain to be run if
  // 1) globalOptions.ascending
  // 2) haveEffect($effect`Synthesis: Greed`) - 100 > myAdventures() + (fullnessLimit() - myFullness()) * 6.5 + (inebrietyLimit() - myInebriety()) * 7.5;
  // This is likely the most optimal configuration for everyone, since we would otherwise
  // have high demand for jellies using less optimal configurations, leading to decreased profits for everyone

  meatMood(false).execute(estimatedTurns());
  potionSetup(false); // This is the default set up for embezzlers (which helps us estimate if chaining is better than extros)
  useFamiliar($familiar`Urchin Urchin`);
  maximize("meat", false);

  cliExecute(`closet put ${myMeat() - 5000000} meat`);
  if (!yachtzeeChainDiet()) {
    cliExecute(`closet take ${myClosetMeat()} meat`);
    return;
  }
  let jellyTurns = property.getNumber("_stenchJellyChargeTarget");
  let fishyTurns =
    haveEffect($effect`Fishy`) +
    (have($item`Platinum Yendorian Express Card`) && !get(`expressCardUsed`) ? 5 : 0);
  let turncount = myTurncount();
  yachtzeePotionSetup(Math.min(jellyTurns, fishyTurns));
  cliExecute(`closet take ${myClosetMeat()} meat`);
  safeRestore();

  let plantCrookweed = true;
  set("choiceAdventure918", 2);
  while (Math.min(jellyTurns, fishyTurns) > 0) {
    executeNextDietStep();
    if (!property.getBoolean("stenchJellyUsed")) throw "We did not use stench jellies";
    adv1($location`The Sunken Party Yacht`, -1, "");
    if (myTurncount() > turncount || haveEffect($effect`Fishy`) < fishyTurns) {
      fishyTurns -= 1;
      jellyTurns -= 1;
      turncount = myTurncount();
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
  else if (property.getBoolean("_garboYachtzeeChainCompleted")) return;
  print("Running Yachtzee Chain", "purple");
  _yachtzeeChain();
  set("_garboYachtzeeChainCompleted", true);
  if (!globalOptions.noDiet) {
    runDiet();
    prepFamiliars(); // Recompute robo drinks' worth after diet is finally consumed
  }
}
