import { canAdv } from "canadv.ash";
import {
  availableAmount,
  buy,
  canEquip,
  canInteract,
  chew,
  cliExecute,
  drink,
  eat,
  Effect,
  equip,
  equippedItem,
  Familiar,
  familiarWeight,
  fullnessLimit,
  haveEffect,
  haveEquipped,
  inebrietyLimit,
  Item,
  itemAmount,
  mallPrice,
  maximize,
  myFamiliar,
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
  toInt,
  toSlot,
  use,
  useFamiliar,
  useSkill,
  visitUrl,
  weightAdjustment,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $items,
  $location,
  $skill,
  $slot,
  $slots,
  adventureMacro,
  clamp,
  findLeprechaunMultiplier,
  get,
  getActiveEffects,
  getActiveSongs,
  getModifier,
  have,
  isSong,
  Macro,
  Mood,
  Requirement,
  set,
  sum,
  uneffect,
} from "libram";
import { acquire } from "./acquire";
import { withStash } from "./clan";
import { prepFamiliars } from "./dailies";
import { runDiet } from "./diet";
import { embezzlerCount, EmbezzlerFight, embezzlerSources } from "./embezzler";
import { hasMonsterReplacers } from "./extrovermectin";
import { meatFamiliar } from "./familiar";
import { doSausage } from "./fights";
import {
  baseMeat,
  burnLibrams,
  globalOptions,
  realmAvailable,
  safeRestore,
  turnsToNC,
} from "./lib";
import { meatMood } from "./mood";
import { familiarWaterBreathingEquipment, useUPCs, waterBreathingEquipment } from "./outfit";
import { farmingPotions, mutuallyExclusive, Potion, potionSetup } from "./potions";
import { garboValue } from "./session";
import synthesize from "./synthesis";

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
      new YachtzeeDietEntry(`extra-greasy slider`, 0, 5, 0, -5, (n: number) => {
        ensureConsumable(`extra-greasy slider`, n, 5, 0, -5);
        eat(n, $item`extra-greasy slider`);
      }),
      new YachtzeeDietEntry(`jar of fermented pickle juice`, 0, 0, 5, -5, (n: number) => {
        ensureConsumable(`jar of fermented pickle juice`, n, 0, 5, -5);
        castOde(5 * n);
        drink(n, $item`jar of fermented pickle juice`);
      }),
      new YachtzeeDietEntry(`Extrovermectin™`, 0, 0, 0, 2, (n: number) => {
        ensureConsumable(`Extrovermectin™`, n, 0, 0, 2);
        chew(n, $item`Extrovermectin™`);
      }),
      new YachtzeeDietEntry("synthesis", 0, 0, 0, 1, (n: number) => {
        ensureConsumable(`synthesis`, n, 0, 0, 1);
        synthesize(n, $effect`Synthesis: Greed`);
      }),
      new YachtzeeDietEntry(`mojo filter`, 0, 0, 0, -1, (n: number) => {
        use(n, $item`mojo filter`);
      }),
      new YachtzeeDietEntry(`beggin' cologne`, 0, 0, 0, 1, (n: number) => {
        ensureConsumable(`beggin' cologne`, n, 0, 0, 1);
        chew(n, $item`beggin' cologne`);
      }),
      new YachtzeeDietEntry(`stench jelly`, 0, 0, 0, 1, (n: number) => {
        ensureConsumable(`stench jelly`, n, 0, 0, 1);
        chew(n, $item`stench jelly`);
      }),
      new YachtzeeDietEntry(`jumping horseradish`, 0, 1, 0, 0, (n: number) => {
        ensureConsumable(`jumping horseradish`, n, 1, 0, 0);
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

function shrugIrrelevantSongs(): void {
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

function executeNextDietStep(stopBeforeJellies?: boolean): void {
  if (get("_stenchJellyUsed", false)) return;
  print("Executing next diet steps", "blue");
  const dietUtil = new YachtzeeDietUtils();
  dietUtil.resetDietPref();

  const dietString = get("_garboYachtzeeChainDiet").split(",");
  let stenchJellyConsumed = false;
  for (const name of dietString) {
    if (name.length === 0) continue;
    else if (!stenchJellyConsumed && name === "stench jelly") {
      if (stopBeforeJellies) dietUtil.addToPref(1, name);
      else {
        chew(1, $item`stench jelly`);
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
              acquire(1, $item`milk of magnesium`, 10000);
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

  // We assume the menu was constructed such that we will not overshoot our fullness and inebriety limits
  // Assume all fullness/drunkenness > 0 non-spleen cleansers are inserted for buffs
  // This makes it trivial to plan the diet
  // First, lay out all the spleen cleansers (and the buff consumables at the front)
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

function yachtzeeBuffValue(obj: Item | Effect): number {
  return (2000 * (getModifier("Meat Drop", obj) + getModifier("Familiar Weight", obj) * 2.5)) / 100;
}

function getBestWaterBreathingEquipment(yachtzeeTurns: number): { item: Item; cost: number } {
  const waterBreathingEquipmentCosts = waterBreathingEquipment.map((it) => ({
    item: it,
    cost:
      have(it) && canEquip(it)
        ? yachtzeeTurns * yachtzeeBuffValue(equippedItem(toSlot(it)))
        : Infinity,
  }));
  const bestWaterBreathingEquipment = waterBreathingEquipment.some((item) => haveEquipped(item))
    ? { item: $item`none`, cost: 0 }
    : waterBreathingEquipmentCosts.reduce((left, right) => (left.cost < right.cost ? left : right));
  return bestWaterBreathingEquipment;
}

function optimizeForFishy(yachtzeeTurns: number, setup?: boolean): number {
  // Returns the lowest cost for fishy
  // Assume we already maximized for meat; this returns the cost of swapping out meat% equips for underwater breathing equips
  const bestWaterBreathingEquipment = getBestWaterBreathingEquipment(yachtzeeTurns);

  if (
    setup &&
    !have($effect`Really Deep Breath`) &&
    bestWaterBreathingEquipment.item !== $item`none`
  ) {
    equip(bestWaterBreathingEquipment.item);
    if (
      equippedItem($slot`hat`) === $item`The Crown of Ed the Undying` &&
      get("edPiece") !== "fish"
    ) {
      cliExecute("edpiece fish");
    }
  }
  // If we already have fishy, then we longer need to consider the cost of obtaining it
  if (haveEffect($effect`Fishy`) >= yachtzeeTurns) return 0;

  // Restore here if we potentially need to visit an adventure.php zone to grab fishy turns
  if (haveEffect($effect`Beaten Up`)) {
    uneffect($effect`Beaten Up`);
  }
  safeRestore();

  // Compute the cost of losing buffs if we spend turns getting fishy using clovers
  const havePYECCharge = get("_PYECAvailable", false);
  const haveFishyPipe = have($item`fishy pipe`) && !get("_fishyPipeUsed", false);
  let costOfLosingBuffs = 0;
  getActiveEffects().forEach(
    (eff: Effect) =>
      (costOfLosingBuffs +=
        yachtzeeBuffValue(eff) > 0 // We only consider buffs that affect our meat% and fam wt
          ? haveEffect(eff) <= 1 + toInt(haveFishyPipe) && havePYECCharge // If we lose all the turns of our buff
            ? (6 + toInt(haveFishyPipe)) * yachtzeeBuffValue(eff) // we also lose the potential of extending it with PYEC (e.g. $effect`smart drunk`)
            : haveEffect(eff) + 5 * toInt(havePYECCharge) < yachtzeeTurns // Else if we don't have enough turns of the buff to cover yachtzeeTurns
            ? (1 + toInt(haveFishyPipe)) * yachtzeeBuffValue(eff) // we lose that many turns worth of value of the buff (e.g. $effect`Puzzle Champ`)
            : 0 // Else, we could potentially lose value from not having enough buffs for embezzlers, but that's out of scope for now
          : 0) // Buffs that don't affect our meat% and fam wt are not considered
  );
  const fishySources = [
    {
      name: "fish juice box",
      cost:
        garboValue($item`fish juice box`) +
        (!haveFishyPipe &&
        haveEffect($effect`Fishy`) + 20 + 5 * toInt(havePYECCharge) < yachtzeeTurns
          ? Infinity
          : 0),
      action: () => {
        acquire(1, $item`fish juice box`, 1.2 * garboValue($item`fish juice box`));
        if (!have($item`fish juice box`)) throw new Error("Unable to obtain fish juice box");
        use(1, $item`fish juice box`);
        use(1, $item`fishy pipe`);
      },
    },
    {
      name: "2x fish juice box",
      cost: 2 * garboValue($item`fish juice box`),
      action: () => {
        acquire(2, $item`fish juice box`, 1.2 * garboValue($item`fish juice box`));
        if (availableAmount($item`fish juice box`) < 2) {
          throw new Error("Unable to obtain sufficient fish juice boxes");
        }
        use(2, $item`fish juice box`);
      },
    },
    {
      name: "cuppa Gill tea",
      cost: garboValue($item`cuppa Gill tea`) + bestWaterBreathingEquipment.cost,
      action: () => {
        acquire(1, $item`cuppa Gill tea`, 1.2 * garboValue($item`cuppa Gill tea`));
        if (!have($item`cuppa Gill tea`)) throw new Error("Unable to obtain cuppa Gill tea");
        use(1, $item`cuppa Gill tea`);
      },
    },
    {
      name: "powdered candy sushi set",
      cost: garboValue($item`powdered candy sushi set`) + bestWaterBreathingEquipment.cost,
      action: () => {
        acquire(
          1,
          $item`powdered candy sushi set`,
          1.2 * garboValue($item`powdered candy sushi set`)
        );
        if (!have($item`powdered candy sushi set`)) {
          throw new Error("Unable to obtain powdered candy sushi set");
        }
        use(1, $item`powdered candy sushi set`);
      },
    },
    {
      name: "concentrated fish broth",
      cost: garboValue($item`concentrated fish broth`) + bestWaterBreathingEquipment.cost,
      action: () => {
        acquire(
          1,
          $item`concentrated fish broth`,
          1.2 * garboValue($item`concentrated fish broth`)
        );
        if (!have($item`concentrated fish broth`)) {
          throw new Error("Unable to obtain concentrated fish broth");
        }
        use(1, $item`concentrated fish broth`);
      },
    },
    {
      name: "Lutz, the Ice Skate",
      cost:
        get("_skateBuff1", false) || get("skateParkStatus") !== "ice"
          ? Infinity
          : bestWaterBreathingEquipment.cost,
      action: () => {
        cliExecute("skate lutz");
      },
    },
    {
      name: "The Haggling",
      cost: canAdv($location`The Brinier Deepers`)
        ? (have($effect`Lucky!`) ? 0 : garboValue($item`11-leaf clover`)) +
          get("valueOfAdventure") +
          bestWaterBreathingEquipment.cost +
          costOfLosingBuffs
        : Infinity,
      action: () => {
        if (!have($effect`Lucky!`)) {
          acquire(1, $item`11-leaf clover`, 1.2 * garboValue($item`11-leaf clover`));
          if (!have($item`11-leaf clover`)) {
            throw new Error("Unable to get 11-leaf clover for fishy!");
          }
          use(1, $item`11-leaf clover`);
        }
        if (haveFishyPipe) use(1, $item`fishy pipe`);
        adventureMacro($location`The Brinier Deepers`, Macro.abort());
        if (get("lastAdventure") !== "The Brinier Deepers") {
          print(
            "We failed to adventure in The Brinier Deepers, even though we thought we could. Try manually adventuring there for a lucky adventure.",
            "red"
          );
        }
        if (haveEffect($effect`Fishy`) < yachtzeeTurns) {
          throw new Error("Failed to get fishy from clover adv");
        }
      },
    },
  ];

  const bestFishySource = fishySources.reduce((left, right) => {
    return left.cost < right.cost ? left : right;
  });

  print("Cost of Fishy sources:", "blue");
  fishySources.forEach((source) => {
    print(`${source.name} (${source.cost})`, "blue");
  });
  if (setup) {
    print(`Taking best fishy source: ${bestFishySource.name}`, "blue");
    bestFishySource.action();
  }
  return bestFishySource.cost;
}

function yachtzeeChainDiet(simOnly?: boolean): boolean {
  if (get("_garboYachtzeeChainDietPlanned", false)) return true;

  const havePYECCharge = get("_PYECAvailable", false);
  const maxYachtzeeTurns = havePYECCharge ? 35 : 30;
  const haveDistentionPill = !get("_distentionPillUsed") && have($item`distention pill`);

  // Plan our diet (positive values give space, negative values take space)
  const sliders = Math.floor((fullnessLimit() + toInt(haveDistentionPill) - myFullness()) / 5);
  const pickleJuice = Math.floor((inebrietyLimit() - myInebriety()) / 5);
  const reqSynthTurns = 30; // We will be left with max(0, 30 - yachtzeeTurns) after chaining
  const synth =
    haveEffect($effect`Synthesis: Greed`) < reqSynthTurns
      ? -Math.ceil((reqSynthTurns - haveEffect($effect`Synthesis: Greed`)) / 30)
      : 0;
  const filters = 3 - get("currentMojoFilters");
  const extros = hasMonsterReplacers() ? -(4 - Math.min(4, 2 * get("beGregariousCharges"))) : 0; // save some spleen for macroed embezzlies
  let cologne = 0;
  const availableSpleen = // Spleen available for ingesting jellies
    spleenLimit() - mySpleenUse() + 5 * sliders + 5 * pickleJuice + synth + filters + extros;

  set("_stenchJellyChargeTarget", 0);

  if (availableSpleen < 30) {
    print("We were unable to generate enough organ space for optimal yachtzee chaining", "red");
    return false;
  }

  const yachtzeeTurns = availableSpleen >= maxYachtzeeTurns ? maxYachtzeeTurns : 30;
  if (availableSpleen > yachtzeeTurns) cologne = -1; // If we have excess spleen, chew a cologne (representing -1 to availableSpleen, but we no longer need that variable)

  if (simOnly) print(`We can potentially run ${yachtzeeTurns} for yachtzee`, "purple");
  else print(`Trying to run ${yachtzeeTurns} turns of Yachtzee`, "purple");

  // Compute prices to make sure everything is worth it
  const fishyCost = optimizeForFishy(yachtzeeTurns);
  const jelliesBulkPrice = retrievePrice($item`stench jelly`, yachtzeeTurns);
  const extroPrice = garboValue($item`Extrovermectin™`);
  const VOA = get("valueOfAdventure");
  const slidersPrice = garboValue($item`extra-greasy slider`);
  const pickleJuicePrice = garboValue($item`jar of fermented pickle juice`);
  const colognePrice = garboValue($item`beggin' cologne`);

  // We prefer using pickle juice to cleanse our spleen for stench jellies since
  // 1) It's cheaper
  // 2) Our stomach can be used for horseradish buffs
  const spleenToClean =
    yachtzeeTurns - filters - synth - extros - cologne - (spleenLimit() - mySpleenUse());
  const pickleJuiceToDrink = clamp(Math.ceil(spleenToClean / 5), 0, pickleJuice);
  const slidersToEat = clamp(Math.ceil(spleenToClean / 5) - pickleJuiceToDrink, 0, sliders);
  const extrosToChew = -extros / 2;
  const synthToUse = -synth;
  const cologneToChew = -cologne;

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
  const higherBaseMeatProfits =
    yachtzeePotionSetup(yachtzeeTurns, true) +
    cologneToChew * ((yachtzeeTurns + 60 + 5 * toInt(havePYECCharge)) * 1000 - colognePrice);

  // We assume that the embezzlers after yachtzee chaining would still benefit from our start-of-day buffs
  // so the assumption is that all the gregged embezzlies can be approximated as marginal KGEs with profits of 3 * VOA
  const extroValuePerSpleen = 6 * VOA - extroPrice / 2;
  const jellyValuePerSpleen =
    (earlyMeatDropsEstimate * 2000) / 100 -
    (jelliesBulkPrice +
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
  const horseradishes =
    haveEffect($effect`Kicked in the Sinuses`) < 30 &&
    myFullness() + 1 + slidersToEat * 5 <= fullnessLimit() + toInt(haveDistentionPill)
      ? 1
      : 0;

  const addPref = (n: number, name?: string) => {
    dietUtil.addToPref(n, name);
  };
  const dietUtil = new YachtzeeDietUtils(addPref);
  dietUtil.resetDietPref();
  dietUtil.setDietEntry(`extra-greasy slider`, slidersToEat);
  dietUtil.setDietEntry(`jar of fermented pickle juice`, pickleJuiceToDrink);
  dietUtil.setDietEntry(`Extrovermectin™`, extrosToChew);
  dietUtil.setDietEntry(`synthesis`, synthToUse);
  dietUtil.setDietEntry(`mojo filter`, filters);
  dietUtil.setDietEntry(`beggin' cologne`, cologneToChew);
  dietUtil.setDietEntry(`jumping horseradish`, horseradishes);
  dietUtil.setDietEntry(`stench jelly`, yachtzeeTurns, (n: number, name?: string) => {
    dietUtil.addToPref(n, name);
    if (!simOnly) {
      set("_stenchJellyChargeTarget", get("_stenchJellyChargeTarget", 0) + n);
    }
  });

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
    yachtzeeTurns,
    $item`stench jelly`,
    (2 * jelliesBulkPrice) / yachtzeeTurns,
    true,
    1.2 * jelliesBulkPrice // Bulk jelly purchases may cost > 1m in the future
  );
  if (itemAmount($item`stench jelly`) < yachtzeeTurns) {
    throw new Error("Failed to acquire sufficient stench jellies");
  }
  if (extrosToChew > 0) {
    acquire(extrosToChew, $item`Extrovermectin™`, 100000, true);
    if (itemAmount($item`Extrovermectin™`) < extrosToChew) {
      throw new Error("Failed to acquire sufficient Extrovermectins™");
    }
  }
  if (pickleJuiceToDrink > 0) {
    acquire(pickleJuiceToDrink, $item`jar of fermented pickle juice`, maxPickleJuicePrice, true);
    if (itemAmount($item`jar of fermented pickle juice`) < pickleJuiceToDrink) {
      throw new Error("Failed to acquire sufficient jars of fermented pickle juice");
    }
  }
  if (slidersToEat > 0) {
    acquire(slidersToEat, $item`extra-greasy slider`, maxSliderPrice, true);
    if (itemAmount($item`extra-greasy slider`) < slidersToEat) {
      throw new Error("Failed to acquire sufficient extra-greasy sliders");
    }
  }
  if (cologneToChew > 0) {
    acquire(cologneToChew, $item`beggin' cologne`, 2 * colognePrice, true);
    if (itemAmount($item`beggin' cologne`) < cologneToChew) {
      throw new Error("Failed to acquire sufficient beggin' colognes");
    }
  }
  if (filters > 0) {
    acquire(filters, $item`mojo filter`, 2 * garboValue($item`mojo filter`), true);
    if (itemAmount($item`mojo filter`) < filters) {
      throw new Error("Failed to acquire sufficient mojo filters");
    }
  }
  if (horseradishes > 0) {
    acquire(horseradishes, $item`jumping horseradish`, 60000, true);
    if (itemAmount($item`jumping horseradish`) < horseradishes) {
      throw new Error("Failed to acquire sufficient jumping horseradishes");
    }
  }

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
  // If we have an unused PYEC then
  // 1) If we don't have an effect, +5 to gained effect duration
  // 2) If we already have an effect, +5 to existing effect duration
  // This means that the first use of a potion that we don't already have an effect of is more valuable than the next use
  const PYECOffset = 5 * toInt(get("_PYECAvailable", false));
  const existingOffset = haveEffect(potion.effect()) ? PYECOffset : 0;
  const extraOffset = PYECOffset - existingOffset;
  const effectiveYachtzeeTurns = Math.max(
    Math.min(
      yachtzeeTurns - haveEffect(potion.effect()) - existingOffset,
      potion.effectDuration() + extraOffset
    ),
    0
  );
  const embezzlerTurns = Math.min(
    expectedEmbezzlers,
    Math.max(potion.effectDuration() + extraOffset - effectiveYachtzeeTurns, 0)
  );
  const barfTurns = Math.max(
    potion.effectDuration() + extraOffset - effectiveYachtzeeTurns - embezzlerTurns,
    0
  );
  const embezzlerValue = embezzlerTurns > 0 ? potion.gross(embezzlerTurns) : 0;
  const yachtzeeValue =
    (effectiveYachtzeeTurns * 2000 * (potion.meatDrop() + 2.5 * potion.familiarWeight())) / 100; // Every 1lbs of lep ~ 2.5% meat drop
  const barfValue = (barfTurns * baseMeat * turnsToNC) / (turnsToNC + 1);

  return yachtzeeValue + embezzlerValue + barfValue - potion.price(true);
}

function yachtzeePotionSetup(yachtzeeTurns: number, simOnly?: boolean): number {
  let totalProfits = 0;
  const PYECOffset = 5 * toInt(get("_PYECAvailable", false));
  const excludedEffects = new Set<Effect>();

  shrugIrrelevantSongs();

  if (have($item`Eight Days a Week Pill Keeper`) && !get("_freePillKeeperUsed", false)) {
    const doublingPotions = farmingPotions
      .filter(
        (potion) =>
          potion.canDouble &&
          haveEffect(potion.effect()) + PYECOffset * toInt(haveEffect(potion.effect()) > 0) <
            yachtzeeTurns &&
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
        `Expected to profit ${profit} meat from doubling 1 ${bestPotion.potion} @ price ${price} meat`,
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

  const testPotions = farmingPotions
    .filter(
      (potion) =>
        haveEffect(potion.effect()) + PYECOffset * toInt(haveEffect(potion.effect()) > 0) <
          yachtzeeTurns && yachtzeePotionProfits(potion, yachtzeeTurns) > 0
    )
    .sort(
      (left, right) =>
        yachtzeePotionProfits(right, yachtzeeTurns) - yachtzeePotionProfits(left, yachtzeeTurns)
    );

  for (const potion of testPotions) {
    const effect = potion.effect();
    const price = potion.price(true);
    if (
      haveEffect(effect) + PYECOffset * toInt(haveEffect(effect) > 0) >= yachtzeeTurns ||
      price > myMeat()
    ) {
      continue;
    }
    if (!excludedEffects.has(effect)) {
      let tries = 0;
      while (haveEffect(effect) + PYECOffset * toInt(haveEffect(effect) > 0) < yachtzeeTurns) {
        tries++;
        print(`Considering effect ${effect} from source ${potion.potion}`, "blue");
        const profit = yachtzeePotionProfits(potion, yachtzeeTurns);
        if (profit < 0) break;
        const nPotions = have(effect)
          ? clamp(
              Math.floor(
                (yachtzeeTurns - haveEffect(effect) - PYECOffset) / potion.effectDuration()
              ),
              1,
              Math.max(1, yachtzeeTurns - PYECOffset)
            )
          : 1;

        totalProfits += nPotions * profit;
        print(
          `Expected to profit ${nPotions * profit} meat from using ${nPotions} ${
            potion.potion
          } @ price ${price} meat each`,
          "blue"
        );
        if (!simOnly) {
          acquire(nPotions, potion.potion, profit + price);
          if (itemAmount(potion.potion) < 1) break;
          if (isSong(effect) && !have(effect)) {
            for (const song of getActiveSongs()) {
              const slot = Mood.defaultOptions.songSlots.find((slot) => slot.includes(song));
              if (!slot || slot.includes(effect)) {
                cliExecute(`shrug ${song}`);
              }
            }
          }
          if (
            !potion.use(Math.min(itemAmount(potion.potion), nPotions)) ||
            tries >= 5 * Math.ceil(yachtzeeTurns / potion.effectDuration())
          ) {
            break;
          }
        } else break;
      }
      if (have(effect) || simOnly) {
        for (const excluded of mutuallyExclusive.get(effect) ?? []) {
          excludedEffects.add(excluded);
        }
      }
    }
  }

  if (!simOnly) {
    executeNextDietStep(true);
    if (get("_PYECAvailable", false)) {
      maximize("MP", false);
      if (have($item`Platinum Yendorian Express Card`)) {
        burnLibrams(200);
        use($item`Platinum Yendorian Express Card`);
      } else {
        withStash($items`Platinum Yendorian Express Card`, () => {
          if (have($item`Platinum Yendorian Express Card`)) {
            burnLibrams(200);
            use($item`Platinum Yendorian Express Card`);
          }
        });
      }
    }
    if (have($item`License to Chill`) && !get("_licenseToChillUsed")) {
      burnLibrams(200);
      use($item`License to Chill`);
    }
    if (!get("_bagOTricksUsed")) {
      withStash($items`Bag o' Tricks`, () => {
        burnLibrams(200);
        use($item`Bag o' Tricks`);
      });
    }
    burnLibrams(200);
    set("_PYECAvailable", false);
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
    const price = mallPrice($item`Uncle Greenspan's Bathroom Finance Guide`);
    const profit = greenspanValue - price;
    if (profit > 0) {
      print(
        `Expected to profit ${profit} meat from using 1 Uncle Greenspan's Bathroom Finance Guide @ price ${price} meat`,
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

function bestFamUnderwaterGear(fam: Familiar): Item {
  // Returns best familiar gear for yachtzee chaining
  return fam.underwater || have($effect`Driving Waterproofly`) || have($effect`Wet Willied`)
    ? have($item`amulet coin`)
      ? $item`amulet coin`
      : $item`filthy child leash`
    : have($item`das boot`)
    ? $item`das boot`
    : $item`little bitty bathysphere`;
}

export function bestYachtzeeFamiliar(): Familiar {
  const haveUnderwaterFamEquipment = familiarWaterBreathingEquipment.some((item) => have(item));
  const famWt =
    familiarWeight(myFamiliar()) +
    weightAdjustment() -
    numericModifier(equippedItem($slot`familiar`), "Familiar Weight");

  const sortedUnderwaterFamiliars = Familiar.all()
    .filter(
      (fam) =>
        have(fam) &&
        findLeprechaunMultiplier(fam) > 0 &&
        fam !== $familiar`Ghost of Crimbo Commerce` &&
        fam !== $familiar`Robortender` &&
        (fam.underwater || haveUnderwaterFamEquipment)
    )
    .sort(
      (left, right) =>
        numericModifier(right, "Meat Drop", famWt, bestFamUnderwaterGear(right)) -
        numericModifier(left, "Meat Drop", famWt, bestFamUnderwaterGear(left))
    );

  print(`Familiar bonus meat%:`, "blue");
  sortedUnderwaterFamiliars.forEach((fam) => {
    print(
      `${fam} (${numericModifier(fam, "Meat Drop", famWt, bestFamUnderwaterGear(fam)).toFixed(
        2
      )}%)`,
      "blue"
    );
  });

  if (sortedUnderwaterFamiliars.length === 0) return $familiar`none`;
  print(`Best Familiar: ${sortedUnderwaterFamiliars[0]}`, "blue");
  return sortedUnderwaterFamiliars[0];
}

const maximizeMeat = () =>
  new Requirement(
    [
      "meat",
      ...(myFamiliar().underwater ||
      have($effect`Driving Waterproofly`) ||
      have($effect`Wet Willied`)
        ? []
        : ["underwater familiar"]),
    ],
    {
      preventEquip: $items`anemoney clip, cursed magnifying glass, Kramco Sausage-o-Matic™, cheap sunglasses`,
    }
  ).maximize();

function prepareOutfitAndFamiliar() {
  useFamiliar(bestYachtzeeFamiliar());
  if (
    !get("_feastedFamiliars").includes(myFamiliar().toString()) &&
    get("_feastedFamiliars").split(";").length < 5
  ) {
    withStash($items`moveable feast`, () => use($item`moveable feast`));
  }
  maximizeMeat();
  if (!myFamiliar().underwater) {
    equip(
      $slot`familiar`,
      familiarWaterBreathingEquipment
        .filter((it) => have(it))
        .reduce((a, b) =>
          numericModifier(a, "Familiar Weight") > numericModifier(b, "Familiar Weight") ? a : b
        )
    );
  }
}

function stickerSetup(expectedYachts: number) {
  const currentStickers = $slots`sticker1, sticker2, sticker3`.map((s) => equippedItem(s));
  const UPC = $item`scratch 'n' sniff UPC sticker`;
  if (currentStickers.every((sticker) => sticker === UPC)) return;
  const yachtOpportunityCost = 25 * findLeprechaunMultiplier(bestYachtzeeFamiliar());
  const embezzlerOpportunityCost = 25 * findLeprechaunMultiplier(meatFamiliar());
  const addedValueOfFullSword =
    ((75 - yachtOpportunityCost) * expectedYachts * 2000) / 100 +
    ((75 - embezzlerOpportunityCost) * Math.min(20, expectedEmbezzlers) * (750 + baseMeat)) / 100;
  if (mallPrice(UPC) < addedValueOfFullSword / 3) {
    const needed = 3 - currentStickers.filter((sticker) => sticker === UPC).length;
    if (needed) buy(needed, UPC, addedValueOfFullSword / 3);
    useUPCs();
  }
}

function _yachtzeeChain(): void {
  if (myLevel() <= 13 || !canInteract()) return;
  // We definitely need to be able to eat sliders and drink pickle juice
  if (!realmAvailable("sleaze")) return;

  set(
    "_PYECAvailable",
    get("expressCardUsed")
      ? false
      : have($item`Platinum Yendorian Express Card`)
      ? true
      : withStash($items`Platinum Yendorian Express Card`, () => {
          return have($item`Platinum Yendorian Express Card`);
        })
  );

  maximize("MP", false);
  meatMood(false, 750 + baseMeat).execute(embezzlerCount());
  potionSetup(false); // This is the default set up for embezzlers (which helps us estimate if chaining is better than extros)
  maximizeMeat();
  prepareOutfitAndFamiliar();

  const meatLimit = 5000000;
  if (myMeat() > meatLimit) {
    const meatToCloset = myMeat() - meatLimit;
    print("");
    print("");
    print(`We are going to closet all-but-5million meat for your safety!`, "blue");
    print("");
    print("");
    if (!get("_yachtzeeChainClosetedMeat")) {
      set("_yachtzeeChainClosetedMeat", meatToCloset);
    } else {
      set("_yachtzeeChainClosetedMeat", meatToCloset + get("_yachtzeeChainClosetedMeat"));
    }
    cliExecute(`closet put ${meatToCloset} meat`);
  }
  if (!yachtzeeChainDiet()) {
    cliExecute(`closet take ${get("_yachtzeeChainClosetedMeat")} meat`);
    set("_yachtzeeChainClosetedMeat", 0);
    return;
  }
  let jellyTurns = get("_stenchJellyChargeTarget", 0);
  let fishyTurns = haveEffect($effect`Fishy`) + 5 * toInt(get("_PYECAvailable", false));
  let turncount = myTurncount();
  yachtzeePotionSetup(Math.min(jellyTurns, fishyTurns));
  stickerSetup(Math.min(jellyTurns, fishyTurns));
  cliExecute(`closet take ${get("_yachtzeeChainClosetedMeat")} meat`);
  set("_yachtzeeChainClosetedMeat", 0);
  if (haveEffect($effect`Beaten Up`)) {
    uneffect($effect`Beaten Up`);
  }
  meatMood(false, 2000).execute(Math.min(jellyTurns, fishyTurns));
  safeRestore();

  let plantCrookweed = true;
  set("choiceAdventure918", 2);
  while (Math.min(jellyTurns, fishyTurns) > 0) {
    executeNextDietStep();
    if (!get("_stenchJellyUsed", false)) throw new Error("We did not use stench jellies");
    // Switch familiars in case changes in fam weight from buffs means our current familiar is no longer optimal
    prepareOutfitAndFamiliar();
    if (!have($effect`Really Deep Breath`)) {
      const bestWaterBreathingEquipment = getBestWaterBreathingEquipment(
        Math.min(jellyTurns, fishyTurns)
      );
      if (bestWaterBreathingEquipment.item !== $item`none`) equip(bestWaterBreathingEquipment.item);
    }
    if (!have($effect`Polka of Plenty`)) {
      if (have($effect`Ode to Booze`)) cliExecute(`shrug ${$effect`Ode to Booze`}`);
      if (
        getActiveSongs().length < (have($skill`Mariachi Memory`) ? 4 : 3) &&
        have($skill`The Polka of Plenty`)
      ) {
        useSkill($skill`The Polka of Plenty`);
      }
    }
    adventureMacro($location`The Sunken Party Yacht`, Macro.abort());
    if (myTurncount() > turncount || haveEffect($effect`Fishy`) < fishyTurns) {
      fishyTurns -= 1;
      jellyTurns -= 1;
      turncount = myTurncount();
      set("_stenchJellyChargeTarget", get("_stenchJellyChargeTarget", 0) - 1);
      set("_stenchJellyUsed", false);
    }
    if (
      plantCrookweed &&
      visitUrl("forestvillage.php").includes("friarcottage.gif") &&
      !get("_floristPlantsUsed").split(",").includes("Crookweed")
    ) {
      cliExecute("florist plant Crookweed");
    }
    plantCrookweed = false;

    doSausage();
  }
  set("choiceAdventure918", "");
}

export function yachtzeeChain(): void {
  if (!globalOptions.yachtzeeChain) return;
  if (get("_garboYachtzeeChainCompleted", false)) return;
  print("Running Yachtzee Chain", "purple");
  _yachtzeeChain();
  set("_garboYachtzeeChainCompleted", true);
  globalOptions.yachtzeeChain = false;
  if (!globalOptions.noDiet) {
    runDiet();
    prepFamiliars(); // Recompute robo drinks' worth after diet is finally consumed
  }
}
