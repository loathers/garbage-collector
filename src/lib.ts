import { canAdv } from "canadv.ash";
import {
  abort,
  availableChoiceOptions,
  cliExecute,
  eat,
  Familiar,
  handlingChoice,
  haveSkill,
  inebrietyLimit,
  isDarkMode,
  Item,
  Location,
  meatDropModifier,
  Monster,
  mpCost,
  myHp,
  myInebriety,
  myMaxhp,
  myMaxmp,
  myMp,
  myTurncount,
  numericModifier,
  print,
  printHtml,
  restoreHp,
  restoreMp,
  runChoice,
  runCombat,
  todayToString,
  toUrl,
  use,
  useFamiliar,
  useSkill,
  visitUrl,
} from "kolmafia";
import {
  $familiar,
  $item,
  $location,
  $skill,
  ActionSource,
  bestLibramToCast,
  ChateauMantegna,
  ensureFreeRun,
  get,
  getKramcoWandererChance,
  have,
  Macro,
  PropertiesManager,
  property,
  set,
  SongBoom,
} from "libram";

export const embezzlerLog: {
  initialEmbezzlersFought: number;
  digitizedEmbezzlersFought: number;
  sources: Array<string>;
} = {
  initialEmbezzlersFought: 0,
  digitizedEmbezzlersFought: 0,
  sources: [],
};

export const globalOptions: {
  ascending: boolean;
  stopTurncount: number | null;
  saveTurns: number;
  noBarf: boolean;
  askedAboutWish: boolean;
  triedToUnlockHiddenTavern: boolean;
  wishAnswer: boolean;
  simulateDiet: boolean;
  noDiet: boolean;
} = {
  stopTurncount: null,
  ascending: false,
  saveTurns: 0,
  noBarf: false,
  askedAboutWish: false,
  triedToUnlockHiddenTavern: false,
  wishAnswer: false,
  simulateDiet: false,
  noDiet: false,
};

export type BonusEquipMode = "free" | "embezzler" | "dmt" | "barf";

export const WISH_VALUE = 50000;
export const HIGHLIGHT = isDarkMode() ? "yellow" : "blue";

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
    abort("User interrupt requested. Stopping Garbage Collector.");
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
    if (mapPage.includes("<!-- MONSTERID: 1965 -->")) runCombat(Macro.attack().repeat().toString());
    if (handlingChoice()) runChoice(-1);
    if (myTurncount() > myTurns + 1) throw `Map the monsters unsuccessful?`;
    if (tries === 9) throw `Stuck trying to Map the monsters.`;
  }

  const fightPage = visitUrl(
    `choice.php?pwd&whichchoice=1435&option=1&heyscriptswhatsupwinkwink=${monster.id}`
  );
  if (!fightPage.includes(monster.name)) throw "Something went wrong starting the fight.";
}

export function argmax<T>(values: [T, number][]): T {
  return values.reduce(([minValue, minScore], [value, score]) =>
    score > minScore ? [value, score] : [minValue, minScore]
  )[0];
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

export function leprechaunMultiplier(familiar: Familiar): number {
  if (familiar === $familiar`Mutant Cactus Bud`) {
    return numericModifier(familiar, "Leprechaun Effectiveness", 1, $item`none`);
  }
  const meatBonus = numericModifier(familiar, "Meat Drop", 1, $item`none`);
  return Math.pow(Math.sqrt(meatBonus / 2 + 55 / 4 + 3) - Math.sqrt(55) / 2, 2);
}

export function fairyMultiplier(familiar: Familiar): number {
  if (familiar === $familiar`Mutant Fire Ant`) {
    return numericModifier(familiar, "Fairy Effectiveness", 1, $item`none`);
  }
  const itemBonus = numericModifier(familiar, "Item Drop", 1, $item`none`);
  return Math.pow(Math.sqrt(itemBonus + 55 / 4 + 3) - Math.sqrt(55) / 2, 2);
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

export function printHelpMenu(): void {
  printHtml(`<pre style="font-family:consolas;">
    +==============+===================================================================================================+
    |   Argument   |                                            Description                                            |
    +==============+===================================================================================================+
    |    nobarf    | garbo will do beginning of the day setup, embezzlers, and various daily flags, but will           |
    |              |  terminate before normal Barf Mountain turns.                                                     |
    +--------------+---------------------------------------------------------------------------------------------------+
    |    ascend    | garbo will operate under the assumption that you're ascending after running it, rather than       |
    |              |  experiencing rollover. It will use borrowed time, it won't charge stinky cheese items, etc.      |
    +--------------+---------------------------------------------------------------------------------------------------+
    | &lt;somenumber&gt; | garbo will terminate after the specified number of turns, e.g. \`garbo 200\` will terminate after   |
    |              |  200 turns are spent. Negative inputs will cause garbo to terminate when the specified number of turns remain.       |
    +------------------------------------------------------------------------------------------------------------------+
    |   simdiet    | garbo will print out what it computes as an optimal diet and then exit                            |
    +------------------------------------------------------------------------------------------------------------------+
    |    nodiet    | *EXPERIMENTAL* garbo will not eat or drink anything as a part of its run (including pantsgiving)  |
    +--------------+---------------------------------------------------------------------------------------------------+
    |     Note:    | You can use multiple commands in conjunction, e.g. \`garbo nobarf ascend\`.                         |
    +--------------+---------------------------------------------------------------------------------------------------+</pre>`);
  printHtml(`<pre style="font-family:consolas;">
    +==========================+===============================================================================================+
    |         Property         |                                          Description                                          |
    +==========================+===============================================================================================+
    |     valueOfAdventure     | This is a native mafia property, garbo will make purchasing decisions based on this value.    |
    |                          | Recommended to be at least 3501.                                                              |
    +--------------------------+-----------------------------------------------------------------------------------------------+
    |      garbo_stashClan     | If set, garbo will attempt to switch to this clan to take and return useful clan stash items, |
    |                          |  i.e. a Haiku Katana or Repaid Diaper.                                                        |
    +--------------------------+-----------------------------------------------------------------------------------------------+
    |       garbo_vipClan      | If set, garbo will attempt to switch to this clan to utilize VIP furniture if you have a key. |
    +--------------------------+-----------------------------------------------------------------------------------------------+
    | garbo_skipAscensionCheck | Set to true to skip verifying that your account has broken the prism, otherwise you will be   |
    |                          |  warned upon starting the script.                                                             |
    +--------------------------+-----------------------------------------------------------------------------------------------+
    |  garbo_valueOfFreeFight  | Set to whatever you estimate the value of a free fight/run to be for you. (Default 2000)      |
    +--------------------------+-----------------------------------------------------------------------------------------------+
    |     garbo_fightGlitch    | Set to true to fight the glitch season reward. You need certain skills, see relay for info.   |
    +--------------------------+-----------------------------------------------------------------------------------------------+
    |       garbo_buyPass      | Set to true to buy a dinsey day pass with FunFunds at the end of the day, if possible.        |
    +--------------------------+-----------------------------------------------------------------------------------------------+
    |           Note:          | You can manually set these properties, but it's recommended that you use the relay interface. |
    +--------------------------+-----------------------------------------------------------------------------------------------+</pre>`);
}

/**
 * Determines the opportunity cost of not using the Pillkeeper to fight an embezzler
 * @returns The expected value of using a pillkeeper charge to fight an embezzler
 */
export function pillkeeperOpportunityCost(): number {
  // Can't fight an embezzler without treasury access
  // If we have no other way to start a chain, returns 50k to represent the cost of a pocket wish
  return canAdv($location`Cobb's Knob Treasury`, false)
    ? (ChateauMantegna.have() && !ChateauMantegna.paintingFought()) ||
      (have($item`Clan VIP Lounge key`) && !get("_photocopyUsed"))
      ? 15000
      : WISH_VALUE
    : 0;
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

export function safeRestoreMpTarget(): number {
  return Math.min(myMaxmp(), 200);
}

export function safeRestore(): void {
  if (myHp() < myMaxhp() * 0.5) {
    restoreHp(myMaxhp() * 0.9);
  }
  const mpTarget = safeRestoreMpTarget();
  if (myMp() < mpTarget) {
    if (
      (have($item`magical sausage`) || have($item`magical sausage casing`)) &&
      get("_sausagesEaten") < 23
    ) {
      eat($item`magical sausage`);
    } else restoreMp(mpTarget);
  }

  burnLibrams(mpTarget * 2); // Leave a mp buffer when burning
}

export function checkGithubVersion(): void {
  if (process.env.GITHUB_REPOSITORY === "CustomBuild") {
    print("Skipping version check for custom build");
  } else {
    const gitBranches: { name: string; commit: { sha: string } }[] = JSON.parse(
      visitUrl(`https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/branches`)
    );
    const mainBranch = gitBranches.find((branchInfo) => branchInfo.name === "main");
    const mainSha = mainBranch && mainBranch.commit ? mainBranch.commit.sha : "CustomBuild";
    if (process.env.GITHUB_SHA === mainSha) {
      print("Garbo is up to date!", HIGHLIGHT);
    } else {
      print("Garbo is out of date. Please run 'svn update!", "red");
      print(`${process.env.GITHUB_REPOSITORY}/main is at ${mainSha}`);
    }
  }
}

export function realmAvailable(
  identifier: "spooky" | "stench" | "hot" | "cold" | "sleaze" | "fantasy" | "pirate"
): boolean {
  if (identifier === "fantasy") {
    return get(`_frToday`) || get(`frAlways`);
  } else if (identifier === "pirate") {
    return get(`_prToday`) || get(`prAlways`);
  }
  return get(`_${identifier}AirportToday`, false) || get(`${identifier}AirportAlways`, false);
}

export function formatNumber(num: number): string {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
}

export function getChoiceOption(partialText: string): number {
  if (handlingChoice()) {
    const findResults = Object.entries(availableChoiceOptions()).find(
      (value) => value[1].indexOf(partialText) > -1
    );
    if (findResults) {
      return parseInt(findResults[0]);
    }
  }
  return -1;
}
