import { canAdv } from "canadv.ash";
import {
  availableChoiceOptions,
  cliExecute,
  containsText,
  eat,
  Familiar,
  fileToBuffer,
  gametimeToInt,
  getLocketMonsters,
  handlingChoice,
  haveSkill,
  indexOf,
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
  print,
  printHtml,
  restoreHp,
  restoreMp,
  runChoice,
  runCombat,
  todayToString,
  toSlot,
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
  $item,
  $location,
  $monster,
  $skill,
  $slot,
  ActionSource,
  bestLibramToCast,
  ChateauMantegna,
  CombatLoversLocket,
  ensureFreeRun,
  get,
  getKramcoWandererChance,
  getTodaysHolidayWanderers,
  have,
  JuneCleaver,
  Macro,
  PropertiesManager,
  property,
  set,
  SongBoom,
  sum,
  uneffect,
} from "libram";
import { acquire } from "./acquire";
import { garboValue } from "./session";

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
  clarasBellClaimed: boolean;
  yachtzeeChain: boolean;
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
  clarasBellClaimed: get("_claraBellUsed"),
  yachtzeeChain: false,
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
    `<table border=2 width=800 style="font-family:monospace;">${tableRows.join(``)}</table>`
  );
}

/**
 * Determines the opportunity cost of not using the Pillkeeper to fight an embezzler
 * @returns The expected value of using a pillkeeper charge to fight an embezzler
 */
export function pillkeeperOpportunityCost(): number {
  const canTreasury = canAdv($location`Cobb's Knob Treasury`, false);

  const alternateUse = [
    { can: canTreasury, value: 3 * get("valueOfAdventure") },
    {
      can: realmAvailable("sleaze"),
      value: 40000,
    },
  ]
    .filter((x) => x.can)
    .sort((a, b) => b.value - a.value)[0];
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

export function safeRestoreMpTarget(): number {
  return Math.min(myMaxmp(), 200);
}

export function safeRestore(): void {
  if (have($effect`Beaten Up`)) {
    if (get("lastEncounter") === "Sssshhsssblllrrggghsssssggggrrgglsssshhssslblgl") {
      uneffect($effect`Beaten Up`);
    } else {
      throw new Error(
        "Hey, you're beaten up, and that's a bad thing. Lick your wounds, handle your problems, and run me again when you feel ready."
      );
    }
  }
  if (myHp() < myMaxhp() * 0.5) {
    restoreHp(myMaxhp() * 0.9);
  }
  const mpTarget = safeRestoreMpTarget();
  if (myMp() < mpTarget) {
    if (
      have($item`Kramco Sausage-o-Matic™`) &&
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

/**
 * Confirmation dialog that supports automatic resolution via garbo_autoUserConfirm preference
 * @param msg string to display in confirmation dialog
 * @param defaultValue default answer if user doesn't provide one
 * @param timeOut time to show dialog before submitting default value
 * @returns answer to confirmation dialog
 */
export function userConfirmDialog(msg: string, defaultValue: boolean, timeOut?: number): boolean {
  if (get("garbo_autoUserConfirm", false)) {
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

export const steveAdventures: Map<Location, number[]> = new Map([
  [$location`The Haunted Bedroom`, [1, 3, 1]],
  [$location`The Haunted Nursery`, [1, 2, 2, 1, 1]],
  [$location`The Haunted Conservatory`, [1, 2, 2]],
  [$location`The Haunted Billiards Room`, [1, 2, 2]],
  [$location`The Haunted Wine Cellar`, [1, 2, 2, 3]],
  [$location`The Haunted Boiler Room`, [1, 2, 2]],
  [$location`The Haunted Laboratory`, [1, 1, 3, 1, 1]],
]);

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

export function bestJuneCleaverOption(id: typeof JuneCleaver.choices[number]): 1 | 2 | 3 {
  const options = [1, 2, 3] as const;
  return options
    .map((option) => ({
      option,
      value: valueJuneCleaverOption(juneCleaverChoiceValues[id][option]),
    }))
    .sort((a, b) => b.value - a.value)[0].option;
}

const funFunds = garboValue($item`FunFunds™`);

export function getDinseyQuest(): void {
  const dinseyKiosk = "place.php?whichplace=airport_stench&action=airport3_kiosk";
	const page: string = visitUrl(dinseyKiosk);
	let choice: number = 6;
	const at: number = indexOf(page, "Available Assignments");
	if(at == -1)
	{
		return;
	}

	const jobs = [`Track Maintenance`, `Electrical Maintenance`, `Sexism Reduction`, `Racism Reduction`, `Compulsory Fun`, `Waterway Debris Removal`, `Bear Removal`, `Guest Sustenance Assurance` ];

	for (let i = 0; i < 6; i++){
		const job1 = jobs[i];
		const job1At: number = indexOf(page, job1, at);
		if(job1At != -1){
			for (let j = i+1; j < jobs.length; j++){
				const job2 = jobs[j];
				const job2At: number = indexOf(page, job2, at);
				if(job2At != -1){
					if (job1At < job2At){
						choice = 1;
						break;
					}
					else {
						choice = 2;
						break;
					}
				}
			}
      print(`Accepting Dinsey Quest: ${job1}`);
			break;
		}

	}
	runChoice(choice);
}

class dinseyQuestData {
	name: string;
	priority: number;
	questNameKiosk: string;
	questNameQuestLog: string;
	questStateProperty: string;
	questProgressProperty: string;
	questProgressLimit: number;
	canUseWanderers: boolean;
	requiredItem: Item;
	questLocation: Location;
	questFamiliar?: Familiar;
	questOutfit?: string;
	questMood?: string;
	autoAttack?: string;

	/**
	 * Process for determining where to put a wanderer to extract additional value from it
	 * @param name easy to refer to name of the quest
	 * @param priority ranked preference of quests
	 * @param questNameKiosk returns the name of the quest as found at the dinseylandfill Job Kiosk
	 * @param questNameQuestLog returns the name of the quest as found in the quest log
	 * @param questStateProperty name of the mafia property tracing the current state of the quest (e.g. unstarted, step[x], finished)
	 * @param questProgressProperty name of the mafia property that tracks progress of the current quest state
	 * @param questProgressLimit Maximum questProgressProperty can reach
	 * @param canUseWanderers whether wandering monsters can be used to progress the quest
	 * @param requiredItem the required item (if any) needed to be equipped to progress the quest
	 * @param questLocation where to adventure to progress the quest
	 */
	constructor(
		name: string,
		priority: number,
		questNameKiosk: string,
		questNameQuestLog: string,
		questStateProperty: string,
		questProgressProperty: string,
		questProgressLimit: number,
		canUseWanderers: boolean,
		requiredItem: Item,
		questLocation: Location,
		questFamiliar?: Familiar,
		questOutfit?: string,
		questMood?: string,
		autoAttack?: string
	) {
		this.name = name;
		this.priority = priority;
		this.questNameKiosk = questNameKiosk;
		this.questNameQuestLog = questNameQuestLog;
		this.questStateProperty = questStateProperty;
		this.questProgressProperty = questProgressProperty;
		this.questProgressLimit = questProgressLimit;
		this.canUseWanderers = canUseWanderers;
		this.requiredItem = requiredItem;
		this.questLocation = questLocation;
	}

	currentQuest(): boolean {
		if (get(this.questStateProperty) !== "unstarted") {
			return true;
		} else {
			return false;
		}
	}
}

const dinseyQuests = [
	new dinseyQuestData(
		"lube",
		0,
		"Track Maintenance",
		"Super Luber",
		"questEStSuperLuber",
		"",
		0,
		false,
		$item`lube-shoes`,
		$location`Barf Mountain`
	),
	new dinseyQuestData(
		"fuel",
		1,
		"Electrical Maintenance",
		"Give Me Fuel",
		"questEStGiveMeFuel",
		"",
		0,
		false,
		$item`none`,
		$location`The Toxic Teacups`
	),
	new dinseyQuestData(
		"sexism",
		2,
		"Sexism Reduction",
		"Social Justice Adventurer I",
		"questEStSocialJusticeI",
		"dinseySocialJusticeIProgress",
		15,
		true,
		$item`none`,
		$location`Pirates of the Garbage Barges`
	),
	new dinseyQuestData(
		"racism",
		3,
		"Racism Reduction",
		"Social Justice Adventurer II",
		"questEStSocialJusticeII",
		"dinseySocialJusticeIIProgress",
		15,
		true,
		$item`none`,
		$location`Uncle Gator's Country Fun-Time Liquid Waste Sluice`
	),
	new dinseyQuestData(
		"fun",
		4,
		"Compulsory Fun",
		"Whistling Zippity-Doo-Dah",
		"questEStZippityDooDah",
		"dinseyFunProgress",
		15,
		true,
		$item`Dinsey mascot mask`,
		$location`The Toxic Teacups`
	),
	new dinseyQuestData(
		"trash",
		5,
		"Waterway Debris Removal",
		"Teach a Man to Fish Trash",
		"questEStFishTrash",
		"dinseyFilthLevel",
		0,
		true,
		$item`trash net`,
		$location`Pirates of the Garbage Barges`
	),
	new dinseyQuestData(
		"bear",
		6,
		"Bear Removal",
		"Nasty, Nasty Bears",
		"questEStNastyBears",
		"dinseyNastyBearsDefeated",
		8,
		false,
		$item`none`,
		$location`Uncle Gator's Country Fun-Time Liquid Waste Sluice`
	),
	new dinseyQuestData(
		"food",
		7,
		"Guest Sustenance Assurance",
		"Will Work With Food",
		"questEStWorkWithFood",
		"dinseyTouristsFed",
		30,
		false,
		$item`none`,
		$location`Barf Mountain`
	),
];

export function dinseyHasQuest(): boolean {
	for (let i = 0; i < dinseyQuests.length; i++) {
		const quest = dinseyQuests[i];
		if (get(quest.questStateProperty, "") !== "unstarted") {
			return true;
		}
	}

	return false;
}

export function dinseyActiveQuest(): dinseyQuestData {
	for (let i = 0; i < dinseyQuests.length; i++) {
		const quest = dinseyQuests[i];
		if (get(quest.questStateProperty) !== "unstarted") {
			return quest;
		} 
	}

	return new dinseyQuestData("",100,"", "","", "", -1, false, $item`none`, $location`none`);
}

export function dinseyQuestComplete(): boolean {
  const questLog = "questlog.php?which=1";
	if ( dinseyHasQuest() ) {
		const quest = dinseyActiveQuest();
		switch(quest.name) {
			case "fuel":
				return acquire(20,$item`toxic globule`,funFunds*3/20) >= 20;
			case "lube":
				return containsText(visitUrl(questLog),"<b>Kiosk</b>");
			case "trash":
				return get(quest.questProgressProperty, 100) <= quest.questProgressLimit && containsText(visitUrl(questLog),"<b>Kiosk</b>");
			case "fun":
			case "sexism":
			case "racism":
				return get(quest.questProgressProperty, 0) >= quest.questProgressLimit && containsText(visitUrl(questLog),"<b>Kiosk</b>");
			default:
				return get(quest.questProgressProperty, 0) >= quest.questProgressLimit;
		}
	} else {
		return false;
	}		
}

export function DinseyTurnInQuest(): void {		
  const dinseyKiosk = "place.php?whichplace=airport_stench&action=airport3_kiosk";
	if ( dinseyQuestComplete() ) {
		if ( dinseyActiveQuest().name === "racism" )
			set("questEStSocialJusticeI","unstarted");
		visitUrl(dinseyKiosk);
		runChoice(3);
	}
}