import {
  availableChoiceOptions,
  canAdventure,
  choiceFollowsFight,
  cliExecute,
  eat,
  Familiar,
  fileToBuffer,
  fullnessLimit,
  gametimeToInt,
  getLocketMonsters,
  getMonsters,
  gitAtHead,
  gitInfo,
  handlingChoice,
  haveSkill,
  inebrietyLimit,
  isDarkMode,
  Item,
  itemAmount,
  itemDropsArray,
  Location,
  meatDropModifier,
  Monster,
  mpCost,
  myFamiliar,
  myFullness,
  myHp,
  myInebriety,
  myLocation,
  myMaxhp,
  myMaxmp,
  myMp,
  mySoulsauce,
  myTurncount,
  numericModifier,
  print,
  printHtml,
  restoreHp,
  restoreMp,
  runChoice,
  runCombat,
  setLocation,
  Skill,
  soulsauceCost,
  todayToString,
  toSlot,
  totalFreeRests,
  toUrl,
  use,
  useFamiliar,
  userConfirm,
  useSkill,
  visitUrl,
  weaponHands,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $location,
  $monster,
  $skill,
  $slot,
  ActionSource,
  bestLibramToCast,
  ChateauMantegna,
  clamp,
  ClosedCircuitPayphone,
  CombatLoversLocket,
  Counter,
  ensureFreeRun,
  get,
  getKramcoWandererChance,
  getTodaysHolidayWanderers,
  have,
  JuneCleaver,
  Macro,
  maxBy,
  PropertiesManager,
  property,
  set,
  SongBoom,
  sum,
  uneffect,
} from "libram";
import { acquire } from "./acquire";
import { globalOptions } from "./config";
import { garboValue } from "./value";
import { realmAvailable } from "./wanderer/lib";

export const eventLog: {
  initialEmbezzlersFought: number;
  digitizedEmbezzlersFought: number;
  embezzlerSources: Array<string>;
  yachtzees: number;
} = {
  initialEmbezzlersFought: 0,
  digitizedEmbezzlersFought: 0,
  embezzlerSources: [],
  yachtzees: 0,
};

export enum BonusEquipMode {
  FREE,
  EMBEZZLER,
  DMT,
  BARF,
}

export function modeIsFree(mode: BonusEquipMode): boolean {
  return [BonusEquipMode.FREE, BonusEquipMode.DMT].includes(mode);
}

export function modeUseLimitedDrops(mode: BonusEquipMode): boolean {
  return [BonusEquipMode.BARF, BonusEquipMode.FREE].includes(mode);
}

export function modeValueOfMeat(mode: BonusEquipMode): number {
  return modeIsFree(mode) ? 0 : (baseMeat + (mode === BonusEquipMode.EMBEZZLER ? 750 : 0)) / 100;
}

export function modeValueOfItem(mode: BonusEquipMode): number {
  return mode === BonusEquipMode.BARF ? 0.72 : 0;
}

export const WISH_VALUE = 50000;
export const HIGHLIGHT = isDarkMode() ? "yellow" : "blue";
export const ESTIMATED_OVERDRUNK_TURNS = 60;
export const EMBEZZLER_MULTIPLIER = (): number => globalOptions.prefs.embezzlerMultiplier;

export const propertyManager = new PropertiesManager();

export const baseMeat =
  SongBoom.have() &&
  (SongBoom.songChangesLeft() > 0 ||
    (SongBoom.song() === "Total Eclipse of Your Meat" && myInebriety() <= inebrietyLimit()))
    ? 275
    : 250;

export function averageEmbezzlerNet(): number {
  return ((baseMeat + 750) * meatDropModifier()) / 100;
}

export function averageTouristNet(): number {
  return (baseMeat * meatDropModifier()) / 100;
}

export function expectedEmbezzlerProfit(): number {
  return averageEmbezzlerNet() - averageTouristNet();
}

export function safeInterrupt(): void {
  if (get("garbo_interrupt", false)) {
    set("garbo_interrupt", false);
    throw new Error("User interrupt requested. Stopping Garbage Collector.");
  }
}

export function resetDailyPreference(trackingPreference: string): boolean {
  const today = todayToString();
  if (property.getString(trackingPreference) !== today) {
    property.set(trackingPreference, today);
    return true;
  } else {
    return false;
  }
}

export function setChoice(adventure: number, value: number): void {
  propertyManager.setChoices({ [adventure]: value });
}

/**
 * Shuffle a copy of {array}.
 * @param array Array to shuffle.
 */
export function shuffle<T>(array: T[]): T[] {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffledArray[i];
    shuffledArray[i] = shuffledArray[j];
    shuffledArray[j] = temp;
  }
  return shuffledArray;
}

export function mapMonster(location: Location, monster: Monster): void {
  if (
    haveSkill($skill`Map the Monsters`) &&
    !get("mappingMonsters") &&
    get("_monstersMapped") < 3
  ) {
    useSkill($skill`Map the Monsters`);
  }

  if (!get("mappingMonsters")) throw "Failed to setup Map the Monsters.";

  const myTurns = myTurncount();
  let mapPage = "";
  // Handle zone intros and holiday wanderers
  for (let tries = 0; tries < 10; tries++) {
    mapPage = visitUrl(toUrl(location), false, true);
    if (mapPage.includes("Leading Yourself Right to Them")) break;
    // Time-pranks can show up here, annoyingly
    if (
      mapPage.includes("<!-- MONSTERID: 1965 -->") ||
      mapPage.includes("<!-- MONSTERID: 1622  -->")
    ) {
      runCombat(Macro.attack().repeat().toString());
    }
    if (handlingChoice()) runChoice(-1);
    if (myTurncount() > myTurns + 1) throw `Map the monsters unsuccessful?`;
    if (tries === 9) throw `Stuck trying to Map the monsters.`;
  }

  const fightPage = visitUrl(
    `choice.php?pwd&whichchoice=1435&option=1&heyscriptswhatsupwinkwink=${monster.id}`,
  );
  if (!fightPage.includes(monster.name)) {
    throw "Something went wrong starting the fight.";
  }
  if (choiceFollowsFight()) runChoice(-1);
}

/**
 * Returns true if the arguments have all elements equal.
 * @param array1 First array.
 * @param array2 Second array.
 */
export function arrayEquals<T>(array1: T[], array2: T[]): boolean {
  return (
    array1.length === array2.length && array1.every((element, index) => element === array2[index])
  );
}

export function questStep(questName: string): number {
  const stringStep = property.getString(questName);
  if (stringStep === "unstarted" || stringStep === "") return -1;
  else if (stringStep === "started") return 0;
  else if (stringStep === "finished") return 999;
  else {
    if (stringStep.substring(0, 4) !== "step") {
      throw "Quest state parsing error.";
    }
    return parseInt(stringStep.substring(4), 10);
  }
}

export function tryFeast(familiar: Familiar): void {
  if (have(familiar)) {
    useFamiliar(familiar);
    use($item`moveable feast`);
  }
}

export const ltbRun: () => ActionSource = () => {
  return ensureFreeRun({
    requireUnlimited: () => true,
    noFamiliar: () => true,
    noRequirements: () => true,
    maximumCost: () => get("autoBuyPriceLimit") ?? 20000,
  });
};

export function coinmasterPrice(item: Item): number {
  // TODO: Get this from coinmasters.txt if more are needed
  switch (item) {
    case $item`viral video`:
      return 20;
    case $item`plus one`:
      return 74;
    case $item`gallon of milk`:
      return 100;
    case $item`print screen button`:
      return 111;
    case $item`daily dungeon malware`:
      return 150;
  }

  return 0;
}

export function kramcoGuaranteed(): boolean {
  return have($item`Kramco Sausage-o-Matic™`) && getKramcoWandererChance() >= 1;
}

const log: string[] = [];

export function logMessage(message: string): void {
  log.push(message);
}

export function printLog(color: string): void {
  for (const message of log) {
    print(message, color);
  }
}

/**
 * Prints Garbo's help menu to the GCLI.
 */
export function printHelpMenu(): void {
  type tableData = { tableItem: string; description: string };
  const helpData: tableData[] = JSON.parse(fileToBuffer("garbo_help.json"));
  const tableMaxCharWidth = 82;
  const tableRows = helpData.map(({ tableItem, description }) => {
    const croppedDescription =
      description.length > tableMaxCharWidth
        ? description.replace(/(.{82}\s)/g, `$&\n`)
        : description;
    return `<tr><td width=200><pre> ${tableItem}</pre></td><td width=600><pre>${croppedDescription}</pre></td></tr>`;
  });
  printHtml(
    `<table border=2 width=800 style="font-family:monospace;">${tableRows.join(``)}</table>`,
  );
}

/**
 * Determines the opportunity cost of not using the Pillkeeper to fight an embezzler
 * @returns The expected value of using a pillkeeper charge to fight an embezzler
 */
export function pillkeeperOpportunityCost(): number {
  const canTreasury = canAdventure($location`Cobb's Knob Treasury`);

  const alternateUses = [
    { can: canTreasury, value: EMBEZZLER_MULTIPLIER() * get("valueOfAdventure") },
    {
      can: realmAvailable("sleaze"),
      value: 40000,
    },
  ].filter((x) => x.can);

  const alternateUse = alternateUses.length ? maxBy(alternateUses, "value") : undefined;
  const alternateUseValue = alternateUse?.value;

  if (!alternateUseValue) return 0;
  if (!canTreasury) return alternateUseValue;

  const embezzler = $monster`Knob Goblin Embezzler`;
  const canStartChain = [
    CombatLoversLocket.have() && getLocketMonsters()[embezzler.name],
    ChateauMantegna.have() &&
      ChateauMantegna.paintingMonster() === embezzler &&
      !ChateauMantegna.paintingFought(),
    have($item`Clan VIP Lounge key`) && !get("_photocopyUsed"),
  ].some((x) => x);

  return canStartChain ? alternateUseValue : WISH_VALUE;
}

/**
 * Burns existing MP on the mall-optimal libram skill until unable to cast any more.
 */
export function burnLibrams(mpTarget = 0): void {
  let libramToCast = bestLibramToCast();
  while (libramToCast && mpCost(libramToCast) <= myMp() - mpTarget) {
    useSkill(libramToCast);
    libramToCast = bestLibramToCast();
  }
  if (mpTarget > 0) {
    cliExecute(`burn -${mpTarget}`);
  } else {
    cliExecute("burn *");
  }
}

export function howManySausagesCouldIEat() {
  if (!have($item`Kramco Sausage-o-Matic™`)) return 0;
  // You may be full but you can't be overfull
  if (myFullness() > fullnessLimit()) return 0;

  return clamp(
    23 - get("_sausagesEaten"),
    0,
    itemAmount($item`magical sausage`) + itemAmount($item`magical sausage casing`),
  );
}

export function safeRestoreMpTarget(): number {
  //  If our max MP is close to 200, we could be restoring every turn even if we don't need to, avoid that case.
  if (Math.abs(myMaxmp() - 200) < 40) {
    return Math.min(myMaxmp(), 100);
  }
  return Math.min(myMaxmp(), 200);
}

export function safeRestore(): void {
  if (have($effect`Beaten Up`)) {
    if (get("lastEncounter") === "Sssshhsssblllrrggghsssssggggrrgglsssshhssslblgl") {
      uneffect($effect`Beaten Up`);
    } else {
      throw new Error(
        "Hey, you're beaten up, and that's a bad thing. Lick your wounds, handle your problems, and run me again when you feel ready.",
      );
    }
  }
  if (myHp() < Math.min(myMaxhp() * 0.5, get("garbo_restoreHpTarget", 2000))) {
    restoreHp(Math.min(myMaxhp() * 0.9, get("garbo_restoreHpTarget", 2000)));
  }
  const mpTarget = safeRestoreMpTarget();
  const shouldRestoreMp = () => myMp() < mpTarget;

  if (shouldRestoreMp() && howManySausagesCouldIEat() > 0) {
    eat($item`magical sausage`);
  }

  const soulFoodCasts = Math.floor(mySoulsauce() / soulsauceCost($skill`Soul Food`));
  if (shouldRestoreMp() && soulFoodCasts > 0) useSkill(soulFoodCasts, $skill`Soul Food`);

  if (shouldRestoreMp()) restoreMp(mpTarget);

  burnLibrams(mpTarget * 2); // Leave a mp buffer when burning
}

/**
 * Compares the local version of Garbo against the most recent release branch, printing results to the CLI
 */
export function checkGithubVersion(): void {
  if (process.env.GITHUB_REPOSITORY === "CustomBuild") {
    print("Skipping version check for custom build");
  } else {
    if (
      gitAtHead("loathers-garbage-collector-release") ||
      gitAtHead("Loathing-Associates-Scripting-Society-garbage-collector-release")
    ) {
      print("Garbo is up to date!", HIGHLIGHT);
    } else {
      const gitBranches: { name: string; commit: { sha: string } }[] = JSON.parse(
        visitUrl(`https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/branches`),
      );
      const releaseCommit = gitBranches.find((branchInfo) => branchInfo.name === "release")?.commit;
      print("Garbo is out of date. Please run 'git update!'", "red");
      print(
        `Local Version: ${
          gitInfo("loathers-garbage-collector-release").commit ||
          gitInfo("Loathing-Associates-Scripting-Society-garbage-collector-release").commit
        }.`,
      );
      print(`Release Version: ${releaseCommit?.sha}.`);
    }
  }
}

export function formatNumber(num: number): string {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
}

export function getChoiceOption(partialText: string): number {
  if (handlingChoice()) {
    const findResults = Object.entries(availableChoiceOptions()).find(
      (value) => value[1].indexOf(partialText) > -1,
    );
    if (findResults) {
      return parseInt(findResults[0]);
    }
  }
  return -1;
}

/**
 * Confirmation dialog that supports automatic resolution via garbo_autoUserConfirm preference
 * @param msg string to display in confirmation dialog
 * @param defaultValue default answer if user doesn't provide one
 * @param timeOut time to show dialog before submitting default value
 * @returns answer to confirmation dialog
 */
export function userConfirmDialog(msg: string, defaultValue: boolean, timeOut?: number): boolean {
  if (globalOptions.prefs.autoUserConfirm) {
    print(`Automatically selected ${defaultValue} for ${msg}`, "red");
    return defaultValue;
  }

  if (timeOut) return userConfirm(msg, timeOut, defaultValue);
  return userConfirm(msg);
}

export const latteActionSourceFinderConstraints = {
  allowedAction: (action: ActionSource): boolean => {
    if (!have($item`latte lovers member's mug`)) return true;
    const forceEquipsOtherThanLatte = (
      action?.constraints?.equipmentRequirements?.().maximizeOptions.forceEquip ?? []
    ).filter((equipment) => equipment !== $item`latte lovers member's mug`);
    return (
      forceEquipsOtherThanLatte.every((equipment) => toSlot(equipment) !== $slot`off-hand`) &&
      sum(forceEquipsOtherThanLatte, weaponHands) < 2
    );
  },
};

export const today = Date.now() - gametimeToInt() - 1000 * 60 * 3.5;

// Barf setup info
const olfactionCopies = have($skill`Transcendent Olfaction`) ? 3 : 0;
const gallapagosCopies = have($skill`Gallapagosian Mating Call`) ? 1 : 0;
const garbageTourists = 1 + olfactionCopies + gallapagosCopies,
  touristFamilies = 1,
  angryTourists = 1;
const barfTourists = garbageTourists + touristFamilies + angryTourists;
export const garbageTouristRatio = garbageTourists / barfTourists;
const touristFamilyRatio = touristFamilies / barfTourists;
// 30 tourists till NC, with families counting as 3
// Estimate number of turns till the counter hits 27
// then estimate the expected number of turns required to hit a counter of >= 30
export const turnsToNC =
  (27 * barfTourists) / (garbageTourists + angryTourists + 3 * touristFamilies) +
  1 * touristFamilyRatio +
  2 * (1 - touristFamilyRatio) * touristFamilyRatio +
  3 * (1 - touristFamilyRatio) * (1 - touristFamilyRatio);

export function dogOrHolidayWanderer(extraEncounters: string[] = []): boolean {
  return [
    ...extraEncounters,
    "Wooof! Wooooooof!",
    "Playing Fetch*",
    "Your Dog Found Something Again",
    ...getTodaysHolidayWanderers().map((monster) => monster.name),
  ].includes(get("lastEncounter"));
}

export const juneCleaverChoiceValues = {
  1467: {
    1: 0,
    2: 0,
    3: 5 * get("valueOfAdventure"),
  },
  1468: { 1: 0, 2: 5, 3: 0 },
  1469: { 1: 0, 2: $item`Dad's brandy`, 3: 1500 },
  1470: { 1: 0, 2: $item`teacher's pen`, 3: 0 },
  1471: { 1: $item`savings bond`, 2: 250, 3: 0 },
  1472: {
    1: $item`trampled ticket stub`,
    2: $item`fire-roasted lake trout`,
    3: 0,
  },
  1473: { 1: $item`gob of wet hair`, 2: 0, 3: 0 },
  1474: { 1: 0, 2: $item`guilty sprout`, 3: 0 },
  1475: { 1: $item`mother's necklace`, 2: 0, 3: 0 },
} as const;

export function valueJuneCleaverOption(result: Item | number): number {
  return result instanceof Item ? garboValue(result) : result;
}

export function bestJuneCleaverOption(id: (typeof JuneCleaver.choices)[number]): 1 | 2 | 3 {
  const options = [1, 2, 3] as const;
  return maxBy(options, (option) => valueJuneCleaverOption(juneCleaverChoiceValues[id][option]));
}

export const romanticMonsterImpossible = (): boolean =>
  Counter.get("Romantic Monster Window end") === Infinity ||
  (Counter.get("Romantic Monster Window begin") > 0 &&
    Counter.get("Romantic Monster window begin") !== Infinity) ||
  get("_romanticFightsLeft") <= 0;

export function sober(): boolean {
  return myInebriety() <= inebrietyLimit() + (myFamiliar() === $familiar`Stooper` ? -1 : 0);
}

export type GarboItemLists = { Newark: string[]; "Feliz Navidad": string[]; trainset: string[] };

export const asArray = <T>(singleOrArray: T | T[]): T[] =>
  Array.isArray(singleOrArray) ? singleOrArray : [singleOrArray];

let _bestShadowRift: Location | null = null;
export function bestShadowRift(): Location {
  if (!_bestShadowRift) {
    _bestShadowRift = withLocation($location`Shadow Rift`, () =>
      ClosedCircuitPayphone.chooseRift({
        canAdventure: true,
        otherFilter: (l: Location) => l !== $location`Shadow Rift (The 8-Bit Realm)`,
        sortBy: (l: Location) => {
          // We probably aren't capping item drops with the penalty
          // so we don't really need to compute the actual outfit (or the dropModifier for that matter actually)
          const dropModifier = 1 + numericModifier("Item Drop") / 100;
          return sum(getMonsters(l), (m) => {
            return sum(
              itemDropsArray(m),
              ({ drop, rate }) => garboValue(drop) * clamp((rate * dropModifier) / 100, 0, 1),
            );
          });
        },
      }),
    );
    if (!_bestShadowRift) {
      throw new Error("Failed to find a suitable Shadow Rift to adventure in");
    }
  }
  return _bestShadowRift;
}

export function withLocation<T>(location: Location, action: () => T): T {
  const start = myLocation();
  try {
    setLocation(location);
    return action();
  } finally {
    setLocation(start);
  }
}

export function freeRest(): boolean {
  if (get("timesRested") >= totalFreeRests()) return false;

  if (myHp() >= myMaxhp() && myMp() >= myMaxmp()) {
    if (acquire(1, $item`awful poetry journal`, 10000, false)) {
      use($item`awful poetry journal`);
    } else {
      // burn some mp so that we can rest
      const bestSkill = maxBy(
        Skill.all().filter((sk) => have(sk) && mpCost(sk) >= 1),
        (sk) => -mpCost(sk),
      ); // are there any other skills that cost mana which we should blacklist?
      // Facial expressions? But this usually won't be an issue since all *NORMAL* classes have access to a level1 1mp skill
      useSkill(bestSkill);
    }
  }

  if (get("chateauAvailable")) {
    visitUrl("place.php?whichplace=chateau&action=chateau_restlabelfree");
  } else if (get("getawayCampsiteUnlocked")) {
    visitUrl("place.php?whichplace=campaway&action=campaway_tentclick");
  } else {
    visitUrl("campground.php?action=rest");
  }

  return true;
}

export function printEventLog(): void {
  if (resetDailyPreference("garboEmbezzlerDate")) {
    property.set("garboEmbezzlerCount", 0);
    property.set("garboEmbezzlerSources", "");
    property.set("garboYachtzeeCount", 0);
  }
  const totalEmbezzlers =
    property.getNumber("garboEmbezzlerCount", 0) +
    eventLog.initialEmbezzlersFought +
    eventLog.digitizedEmbezzlersFought;

  const allEmbezzlerSources = property
    .getString("garboEmbezzlerSources")
    .split(",")
    .filter((source) => source);
  allEmbezzlerSources.push(...eventLog.embezzlerSources);

  const yacthzeeCount = get("garboYachtzeeCount", 0) + eventLog.yachtzees;

  property.set("garboEmbezzlerCount", totalEmbezzlers);
  property.set("garboEmbezzlerSources", allEmbezzlerSources.join(","));
  property.set("garboYachtzeeCount", yacthzeeCount);

  print(
    `You fought ${eventLog.initialEmbezzlersFought} KGEs at the beginning of the day, and an additional ${eventLog.digitizedEmbezzlersFought} digitized KGEs throughout the day. Good work, probably!`,
    HIGHLIGHT,
  );
  print(
    `Including this, you have fought ${totalEmbezzlers} across all ascensions today`,
    HIGHLIGHT,
  );
  if (yacthzeeCount > 0) {
    print(`You explored the undersea yacht ${eventLog.yachtzees} times`, HIGHLIGHT);
    print(
      `Including this, you explored the undersea yacht ${yacthzeeCount} times across all ascensions today`,
      HIGHLIGHT,
    );
  }
}
