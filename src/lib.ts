import { canAdv } from "canadv.ash";
import {
  abort,
  cliExecute,
  handlingChoice,
  haveSkill,
  inebrietyLimit,
  mpCost,
  myInebriety,
  myMp,
  myTurncount,
  numericModifier,
  print,
  printHtml,
  restoreMp,
  retrieveItem,
  runChoice,
  runCombat,
  toUrl,
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
  Bandersnatch,
  bestLibramToCast,
  ChateauMantegna,
  ensureEffect,
  get,
  getFoldGroup,
  getKramcoWandererChance,
  getSongCount,
  getSongLimit,
  have,
  Macro,
  PropertiesManager,
  property,
  Requirement,
  set,
  SongBoom,
} from "libram";

export const embezzlerLog = {
  initialEmbezzlersFought: 0,
  digitizedEmbezzlersFought: 0,
};

export const globalOptions: {
  ascending: boolean;
  stopTurncount: number | null;
  saveTurns: number;
  noBarf: boolean;
} = {
  stopTurncount: null,
  ascending: false,
  saveTurns: 0,
  noBarf: false,
};

export type BonusEquipMode = "free" | "embezzler" | "dmt" | "barf";

export const propertyManager = new PropertiesManager();

export const baseMeat =
  SongBoom.have() &&
  (SongBoom.songChangesLeft() > 0 ||
    (SongBoom.song() === "Total Eclipse of Your Meat" && myInebriety() <= inebrietyLimit()))
    ? 275
    : 250;

export function safeInterrupt(): void {
  if (get<boolean>("garbo_interrupt", false)) {
    set("garbo_interrupt", false);
    abort("User interrupt requested. Stopping Garbage Collector.");
  }
}

export function setChoice(adventure: number, value: number): void {
  propertyManager.setChoices({ [adventure]: value });
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

export class FreeRun {
  name: string;
  available: () => boolean;
  macro: Macro;
  requirement?: Requirement;
  prepare?: () => void;

  constructor(
    name: string,
    available: () => boolean,
    macro: Macro,
    requirement?: Requirement,
    prepare?: () => void
  ) {
    this.name = name;
    this.available = available;
    this.macro = macro;
    this.requirement = requirement;
    this.prepare = prepare;
  }
}

const banishesToUse = questStep("questL11Worship") > 0 && get("_drunkPygmyBanishes") === 0 ? 2 : 3;

const freeRuns: FreeRun[] = [
  /*
  new freeRun(
     () => {
      if (getWorkshed() !== $item`Asdon Martin keyfob`) return false;
      const banishes = get("banishedMonsters").split(":");
      const bumperIndex = banishes
        .map((string) => string.toLowerCase())
        .indexOf("spring-loaded front bumper");
      if (bumperIndex === -1) return true;
      return myTurncount() - parseInt(banishes[bumperIndex + 1]) > 30;
    },
    () => {
      fillAsdonMartinTo(50);
      retrieveItem(1, $item`louder than bomb`);
    },
    Macro.trySkill($skill`Asdon Martin: Spring-Loaded Front Bumper`).item($item`Louder Than Bomb`)
  ),
  code removed because of boss monsters
  */

  new FreeRun(
    "Bander",
    () =>
      have($familiar`Frumious Bandersnatch`) &&
      (have($effect`Ode to Booze`) || getSongCount() < getSongLimit()) &&
      Bandersnatch.getRemainingRunaways() > 0,
    Macro.trySkill($skill`Asdon Martin: Spring-Loaded Front Bumper`).step("runaway"),
    new Requirement(["Familiar Weight"], {}),
    () => {
      useFamiliar($familiar`Frumious Bandersnatch`);
      ensureEffect($effect`Ode to Booze`);
    }
  ),

  new FreeRun(
    "Boots",
    () => have($familiar`Pair of Stomping Boots`) && Bandersnatch.getRemainingRunaways() > 0,
    Macro.trySkill($skill`Asdon Martin: Spring-Loaded Front Bumper`).step("runaway"),
    new Requirement(["Familiar Weight"], {}),
    () => useFamiliar($familiar`Pair of Stomping Boots`)
  ),

  new FreeRun(
    "Snokebomb",
    () => get("_snokebombUsed") < banishesToUse && have($skill`Snokebomb`),
    Macro.trySkill($skill`Asdon Martin: Spring-Loaded Front Bumper`).skill($skill`Snokebomb`),
    undefined,
    () => restoreMp(50)
  ),

  new FreeRun(
    "Hatred",
    () => get("_feelHatredUsed") < banishesToUse && have($skill`Emotionally Chipped`),
    Macro.trySkill($skill`Asdon Martin: Spring-Loaded Front Bumper`).skill($skill`Feel Hatred`)
  ),

  new FreeRun(
    "KGB",
    () => have($item`Kremlin's Greatest Briefcase`) && get("_kgbTranquilizerDartUses") < 3,
    Macro.trySkill($skill`Asdon Martin: Spring-Loaded Front Bumper`).skill(
      $skill`KGB tranquilizer dart`
    ),
    new Requirement([], { forceEquip: $items`Kremlin's Greatest Briefcase` })
  ),

  new FreeRun(
    "Latte",
    () => have($item`latte lovers member's mug`) && !get("_latteBanishUsed"),
    Macro.trySkill($skill`Asdon Martin: Spring-Loaded Front Bumper`).skill(
      "Throw Latte on Opponent"
    ),
    new Requirement([], { forceEquip: $items`latte lovers member's mug` })
  ),

  new FreeRun(
    "Docbag",
    () => have($item`Lil' Doctor™ bag`) && get("_reflexHammerUsed") < 3,
    Macro.trySkill($skill`Asdon Martin: Spring-Loaded Front Bumper`).skill($skill`Reflex Hammer`),
    new Requirement([], { forceEquip: $items`Lil' Doctor™ bag` })
  ),

  new FreeRun(
    "Middle Finger",
    () => have($item`mafia middle finger ring`) && !get("_mafiaMiddleFingerRingUsed"),
    Macro.trySkill($skill`Asdon Martin: Spring-Loaded Front Bumper`).skill(
      $skill`Show them your ring`
    ),
    new Requirement([], { forceEquip: $items`mafia middle finger ring` })
  ),

  new FreeRun(
    "VMask",
    () => have($item`V for Vivala mask`) && !get("_vmaskBanisherUsed"),
    Macro.trySkill($skill`Asdon Martin: Spring-Loaded Front Bumper`).skill($skill`Creepy Grin`),
    new Requirement([], { forceEquip: $items`V for Vivala mask` }),
    () => restoreMp(30)
  ),

  new FreeRun(
    "Stinkeye",
    () =>
      getFoldGroup($item`stinky cheese diaper`).some((item) => have(item)) &&
      !get("_stinkyCheeseBanisherUsed"),

    Macro.trySkill($skill`Asdon Martin: Spring-Loaded Front Bumper`).skill(
      "Give Your Opponent the Stinkeye"
    ),
    new Requirement([], { forceEquip: $items`stinky cheese eye` }),
    () => {
      if (!have($item`stinky cheese eye`)) cliExecute(`fold stinky cheese eye`);
    }
  ),

  new FreeRun(
    "Navel Ring",
    () => have($item`navel ring of navel gazing`) && get("_navelRunaways") < 3,
    Macro.trySkill($skill`Asdon Martin: Spring-Loaded Front Bumper`).step("runaway"),
    new Requirement([], { forceEquip: $items`navel ring of navel gazing` })
  ),

  new FreeRun(
    "GAP",
    () => have($item`Greatest American Pants`) && get("_navelRunaways") < 3,
    Macro.trySkill($skill`Asdon Martin: Spring-Loaded Front Bumper`).step("runaway"),
    new Requirement([], { forceEquip: $items`Greatest American Pants` })
  ),

  new FreeRun(
    "Scrapbook",
    () => {
      visitUrl("desc_item.php?whichitem=463063785");
      return have($item`familiar scrapbook`) && get("scrapbookCharges") >= 100;
    },
    Macro.trySkill($skill`Asdon Martin: Spring-Loaded Front Bumper`).skill(
      "Show Your Boring Familiar Pictures"
    ),
    new Requirement([], { forceEquip: $items`familiar scrapbook` })
  ),

  new FreeRun(
    "Parasol",
    () =>
      have($item`peppermint parasol`) &&
      globalOptions.ascending &&
      get("parasolUsed") < 9 &&
      get("_navelRunaways") < 3,
    Macro.trySkill($skill`Asdon Martin: Spring-Loaded Front Bumper`).item($item`peppermint parasol`)
  ),
];

export function findRun(useFamiliar = true): FreeRun | undefined {
  return freeRuns.find(
    (run) => run.available() && (useFamiliar || !["Bander", "Boots"].includes(run.name))
  );
}

export const ltbRun = new FreeRun(
  "LTB",
  () => retrieveItem($item`Louder Than Bomb`),
  Macro.item($item`Louder Than Bomb`),
  new Requirement([], {}),
  () => retrieveItem($item`Louder Than Bomb`)
);

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
  if (familiar === $familiar`Mutant Cactus Bud`)
    return numericModifier(familiar, "Leprechaun Effectiveness", 1, $item`none`);
  const meatBonus = numericModifier(familiar, "Meat Drop", 1, $item`none`);
  return Math.pow(Math.sqrt(meatBonus / 2 + 55 / 4 + 3) - Math.sqrt(55) / 2, 2);
}

export function fairyMultiplier(familiar: Familiar): number {
  if (familiar === $familiar`Mutant Fire Ant`)
    return numericModifier(familiar, "Fairy Effectiveness", 1, $item`none`);
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
    |              |  200 turns are spent.                                                                             |
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
  //Can't fight an embezzler without treasury access
  //If we have no other way to start a chain, returns 50k to represent the cost of a pocket wish
  return canAdv($location`Cobb's Knob Treasury`, false)
    ? (ChateauMantegna.have() && !ChateauMantegna.paintingFought()) ||
      (have($item`Clan VIP Lounge key`) && !get("_photocopyUsed"))
      ? 15000
      : 50000
    : 0;
}

/**
 * Burns existing MP on the mall-optimal libram skill until unable to cast any more.
 */
export function burnLibrams(): void {
  let libramToCast = bestLibramToCast();
  while (libramToCast && mpCost(libramToCast) <= myMp()) {
    useSkill(libramToCast);
    libramToCast = bestLibramToCast();
  }
}
