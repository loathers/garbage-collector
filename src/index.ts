import {
  booleanModifier,
  buy,
  changeMcd,
  cliExecute,
  getClanLounge,
  getCounters,
  haveSkill,
  itemAmount,
  myAdventures,
  myClass,
  myGardenType,
  myPrimestat,
  myThrall,
  myTurncount,
  print,
  putCloset,
  retrieveItem,
  reverseNumberology,
  runChoice,
  setAutoAttack,
  setProperty,
  toInt,
  use,
  useFamiliar,
  useSkill,
  visitUrl,
  xpath,
} from "kolmafia";
import {
  $class,
  $effect,
  $familiar,
  $familiars,
  $item,
  $items,
  $location,
  $monster,
  $skill,
  $stat,
  $thrall,
  adventureMacro,
  adventureMacroAuto,
  get,
  have,
  setDefaultMaximizeOptions,
  SongBoom,
  SourceTerminal,
} from "libram";
import { Macro, withMacro } from "./combat";
import { runDiet } from "./diet";
import { freeFightFamiliar, meatFamiliar } from "./familiar";
import { dailyFights, freeFights, safeRestore } from "./fights";
import { ensureEffect } from "./lib";
import { meatMood } from "./mood";
import { freeFightOutfit, meatOutfit, Requirement } from "./outfit";
import { withStash } from "./stash";

// Max price for tickets. You should rethink whether Barf is the best place if they're this expensive.
const TICKET_MAX_PRICE = 500000;

function ensureBarfAccess() {
  if (!(get("stenchAirportAlways") || get("_stenchAirportToday"))) {
    const ticket = $item`one-day ticket to Dinseylandfill`;
    // TODO: Get better item acquisition logic that e.g. checks own mall store.
    if (!have(ticket)) buy(1, ticket, TICKET_MAX_PRICE);
    use(ticket);
  }
  if (!get("_dinseyGarbageDisposed")) {
    print("Disposing of garbage.", "blue");
    retrieveItem($item`bag of park garbage`);
    visitUrl("place.php?whichplace=airport_stench&action=airport3_tunnels");
    runChoice(6);
    cliExecute("refresh inv");
  }
}

function tryFeast(familiar: Familiar) {
  if (have(familiar)) {
    useFamiliar(familiar);
    use($item`moveable feast`);
  }
}

function dailySetup() {
  if (have($familiar`Cornbeefadon`) && !have($item`amulet coin`)) {
    useFamiliar($familiar`Cornbeefadon`);
    use($item`box of Familiar Jacks`);
  }

  if (have($item`portable pantogram`) && !have($item`pantogram pants`)) {
    retrieveItem($item`ten-leaf clover`);
    retrieveItem($item`porquoise`);
    retrieveItem($item`bubblin' crude`);
    const m = new Map([
      [$stat`Muscle`, 1],
      [$stat`Mysticality`, 2],
      [$stat`Moxie`, 3],
    ]).get(myPrimestat());
    visitUrl("inv_use.php?pwd&whichitem=9573");
    visitUrl(`choice.php?whichchoice=1270&pwd&option=1&m=${m}&e=5&s1=5789,1&s2=706,1&s3=24,1`);
  }

  if (have($item`Fourth of May Cosplay Saber`) && get("_saberMod") === 0) {
    // Get familiar weight.
    visitUrl("main.php?action=may4");
    runChoice(4);
  }

  if (have($item`Bastille Battalion control rig`) && get("_bastilleGames") === 0) {
    cliExecute("bastille myst brutalist gesture");
  }

  SongBoom.setSong("Total Eclipse of Your Meat");
  if (SourceTerminal.have()) {
    SourceTerminal.educate([$skill`Extract`, $skill`Digitize`]);
    SourceTerminal.enquiry($effect`familiar.enq`);
  }

  if (get("_VYKEACompanionLevel") === 0) {
    retrieveItem($item`VYKEA hex key`);
    cliExecute("create level 3 couch");
  }

  if (have($familiar`Robortender`)) {
    for (const drink of $items`Newark, drive-by shooting, Feliz Navidad, single entendre, bloody nora`) {
      if (get("_roboDrinks").includes(drink.name)) continue;
      useFamiliar($familiar`robortender`);
      if (itemAmount(drink) === 0) buy(1, drink, 150000);
      print(`Feeding robortender ${drink}.`, "blue");
      visitUrl(`inventory.php?action=robooze&which=1&whichitem=${toInt(drink)}`);
    }
  }

  if (have($item`mumming trunk`) && !get("_mummeryMods").includes("Meat Drop")) {
    useFamiliar(meatFamiliar());
    cliExecute("mummery meat");
  }

  if (
    have($item`mumming trunk`) &&
    !get("_mummeryMods").includes("Item Drop") &&
    have($familiar`Trick-or-Treating Tot`)
  ) {
    useFamiliar($familiar`Trick-or-Treating Tot`);
    cliExecute("mummery item");
  }

  if (get("_feastUsed") === 0) {
    withStash($items`moveable feast`, () => {
      if (have($item`moveable feast`))
        [...$familiars`Pocket Professor, Frumious Bandersnatch`, meatFamiliar()].forEach(tryFeast);
    });
  }

  if (
    myClass() === $class`Pastamancer` &&
    myThrall() !== $thrall`Lasagmbie` &&
    haveSkill($skill`Bind Lasagmbie`)
  ) {
    useSkill($skill`Bind Lasagmbie`);
  }

  if (
    !get("_clanFortuneBuffUsed") &&
    have($item`Clan VIP lounge key`) &&
    getClanLounge()["Clan Carnival Game"] !== undefined
  ) {
    cliExecute("fortune buff meat");
  }

  if (!get("demonSummoned") && get("demonName2", false) && get("questL11Manor") === "finished") {
    cliExecute("summon Preternatural Greed");
  }

  if (get("horseryAvailable") && get("_horsery") !== "dark horse") {
    cliExecute("horsery dark");
  }

  while (SourceTerminal.have() && SourceTerminal.getEnhanceUses() < 3) {
    cliExecute("terminal enhance meat.enh");
  }
  if (!get("_madTeaParty")) {
    ensureEffect($effect`Down the Rabbit Hole`);
    cliExecute("hatter 22");
  }

  changeMcd(10);

  retrieveItem($item`Half a Purse`);

  putCloset(itemAmount($item`hobo nickel`), $item`hobo nickel`);
  putCloset(itemAmount($item`sand dollar`), $item`sand dollar`);
}

function barfTurn() {
  if (SourceTerminal.have()) {
    SourceTerminal.educate([$skill`Extract`, $skill`Digitize`]);
  }
  if (have($item`packet of tall grass seeds`) && myGardenType() !== "grass")
    use($item`packet of tall grass seeds`);
  if (
    have($item`unwrapped retro superhero cape`) &&
    get("retroCapeSuperhero") !== "robot" &&
    get("retroCapeWashingInstructions") !== "kill"
  ) {
    cliExecute("retrocape robot kill");
  }

  while (
    get<Monster>("feelNostalgicMonster") === $monster`Knob Goblin Embezzler` &&
    have($item`backup camera`) &&
    get<number>("_backUpUses") < 11
  ) {
    useFamiliar(meatFamiliar());
    meatOutfit(true, [new Requirement([], { forceEquip: $items`backup camera` })]);
    adventureMacro(
      $location`Noob Cave`,
      Macro.if_(
        "!monstername Knob Goblin Embezzler",
        Macro.skill("Back-Up to Your Last Enemy")
      ).meatKill()
    );
  }

  // a. set up familiar
  useFamiliar(meatFamiliar());

  const embezzlerUp = getCounters("Digitize Monster", 0, 0).trim() !== "";
  let location = embezzlerUp ? $location`Noob Cave` : $location`Barf Mountain`;
  if (
    !get("_envyfishEggUsed") &&
    (booleanModifier("Adventure Underwater") ||
      $items`aerated diving helmet, crappy mer-kin mask, Mer-kin gladiator mask, Mer-kin scholar mask, old SCUBA tank, The Crown of Ed the Undying`.some(
        have
      )) &&
    (booleanModifier("Underwater Familiar") ||
      $items`little bitty bathysphere, das boot`.some(have)) &&
    (have($effect`Fishy`) || (have($item`fishy pipe`) && !get("_fishyPipeUsed"))) &&
    !have($item`envyfish egg`) &&
    embezzlerUp
  ) {
    // now fight one underwater
    if (get("questS01OldGuy") === "unstarted") {
      visitUrl("place.php?whichplace=sea_oldman&action=oldman_oldman");
    }
    retrieveItem($item`pulled green taffy`);
    if (!have($effect`Fishy`)) use($item`fishy pipe`);
    location = $location`The Briny Deeps`;
  }

  const underwater = location === $location`The Briny Deeps`;
  meatOutfit(embezzlerUp, [], underwater);

  // c. set up mood stuff
  meatMood().execute(myAdventures() * 1.04 + 50);

  safeRestore(); //get enough mp to use summer siesta and enough hp to not get our ass kicked
  const ghostLocation = get("ghostLocation");
  // d. run adventure
  if (have($item`envyfish egg`) && !get("_envyfishEggUsed")) {
    meatOutfit(true);
    withMacro(Macro.meatKill(), () => use($item`envyfish egg`));
  } else if (have($item`protonic accelerator pack`) && get("questPAGhost") !== "unstarted" && ghostLocation) {
    useFamiliar(freeFightFamiliar());
    freeFightOutfit([new Requirement([], { forceEquip: $items`protonic accelerator pack` })]);
    adventureMacroAuto(ghostLocation, Macro.trySkill("curse of weaksauce").trySkill("shoot ghost").trySkill("shoot ghost").trySkill("shoot ghost").trySkill("trap ghost"));
  } else {
    adventureMacroAuto(
      location,
      Macro.externalIf(underwater, Macro.item("pulled green taffy")).meatKill()
    );
  }

  if (
    Object.keys(reverseNumberology()).includes("69") &&
    get("_universeCalculated") < get("skillLevel144")
  ) {
    cliExecute("numberology 69");
  }
}

export const globalOptions: { stopTurncount: number | null } = {
  stopTurncount: null,
};

export function canContinue() {
  return (
    myAdventures() > 0 &&
    (globalOptions.stopTurncount === null || myTurncount() < globalOptions.stopTurncount)
  );
}

export function main(argString = "") {
  // TODO: How do we handle Synth? Needs to be integrated with diet stuff.
  // Similar for jumping horseradish etc.

  const args = argString.split(" ");
  for (const arg of args) {
    if (arg.match(/\d+/)) {
      globalOptions.stopTurncount = myTurncount() + parseInt(arg, 10);
    }
  }

  const aaBossFlag = xpath(
    visitUrl("account.php?tab=combat"),
    `//*[@id="opt_flag_aabosses"]/label/input/@value`
  )[0];
  try {
    print("Collecting garbage!", "blue");
    if (globalOptions.stopTurncount !== null) {
      print(`Stopping in ${globalOptions.stopTurncount - myTurncount()}`, "blue");
    }
    print();

    setAutoAttack(0);
    visitUrl(`account.php?actions[]=flag_aabosses&flag_aabosses=1&action=Update`, true);
    setProperty("battleAction", "custom combat script");
    cliExecute("mood apathetic");
    cliExecute("ccs garbo");
    safeRestore();

    // FIXME: Dynamically figure out pointer ring approach.
    withStash($items`haiku katana, repaid diaper`, () => {
      // 0. diet stuff.
      runDiet();

      // 1. get a ticket
      ensureBarfAccess();

      // 2. make an outfit (amulet coin, pantogram, etc), misc other stuff (VYKEA, songboom, robortender drinks)
      dailySetup();

      setDefaultMaximizeOptions({
        preventEquip: $items`broken champagne bottle`,
      });

      // 4. do some embezzler stuff
      freeFights();
      dailyFights();

      // 5. burn turns at barf
      try {
        while (canContinue()) {
          barfTurn();
        }
      } finally {
        setAutoAttack(0);
      }
    });
  } finally {
    visitUrl(`account.php?actions[]=flag_aabosses&flag_aabosses=${aaBossFlag}&action=Update`, true);
  }
}
