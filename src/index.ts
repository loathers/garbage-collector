import {
  buy,
  changeMcd,
  cliExecute,
  eat,
  equippedAmount,
  getCounters,
  itemAmount,
  myAdventures,
  myClass,
  myMp,
  myThrall,
  myTurncount,
  print,
  putCloset,
  retrieveItem,
  reverseNumberology,
  runChoice,
  setAutoAttack,
  toInt,
  use,
  useFamiliar,
  useSkill,
  visitUrl,
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
  $thrall,
  adventureMacro,
  adventureMacroAuto,
  Clan,
  get,
  have,
  setDefaultMaximizeOptions,
  SongBoom,
  SourceTerminal,
} from "libram";
import { Macro, withMacro } from "./combat";
import { runDiet } from "./diet";
import { meatFamiliar } from "./familiar";
import { dailyFights, freeFights } from "./fights";
import { ensureEffect } from "./lib";
import { meatMood } from "./mood";
import { meatOutfit, Requirement } from "./outfit";
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
    cliExecute("pantogram medium mp regen|high meat|clover|silent");
  }

  if (have($item`Fourth of May Cosplay Saber`) && get("_saberMod") === 0) {
    // Get familiar weight.
    visitUrl("main.php?action=may4");
    runChoice(4);
  }

  if (get("_bastilleGames") === 0) {
    cliExecute("bastille myst brutalist gesture");
  }

  SongBoom.setSong("Total Eclipse of Your Meat");
  SourceTerminal.educate([$skill`Extract`, $skill`Digitize`]);

  if (get("_VYKEACompanionLevel") === 0) {
    cliExecute("create level 3 couch");
  }

  if (have($familiar`Robortender`)) {
    for (const drink of $items`Newark, drive-by shooting, Feliz Navidad, single entendre`) {
      if (get("_roboDrinks").includes(drink.name)) continue;
      useFamiliar($familiar`robortender`);
      if (itemAmount(drink) === 0) buy(1, drink, 150000);
      print(`Feeding robortender ${drink}.`, "blue");
      visitUrl(`inventory.php?action=robooze&which=1&whichitem=${toInt(drink)}`);
    }
  }

  if (get("_feastUsed") === 0) {
    withStash($items`moveable feast`, () =>
      [...$familiars`Pocket Professor, Frumious Bandersnatch`, meatFamiliar()].forEach(tryFeast)
    );
  }

  if (myClass() === $class`Pastamancer` && myThrall() !== $thrall`Lasagmbie`) {
    useSkill($skill`Bind Lasagmbie`);
  }

  if (!get("_clanFortuneBuffUsed")) cliExecute("fortune buff meat");
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
    have($item`aerated diving helmet`) &&
    have($item`das boot`) &&
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
  meatOutfit(
    embezzlerUp,
    underwater ? [new Requirement([], { forceEquip: $items`aerated diving helmet, das boot` })] : []
  );

  // c. set up mood stuff
  meatMood().execute(myAdventures() * 1.04 + 50);

  if (equippedAmount($item`haiku katana`) > 0 && myMp() < 50) eat($item`magical sausage`);

  // d. run adventure
  adventureMacroAuto(
    location,
    Macro.externalIf(underwater, Macro.item("pulled green taffy")).meatKill()
  );

  if (have($item`envyfish egg`) && !get("_envyfishEggUsed")) {
    withMacro(Macro.meatKill(), () => use($item`envyfish egg`));
  }

  if (
    Object.keys(reverseNumberology()).includes("69") &&
    get("_universeCalculated") < get("skilllevel144")
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

  print("Collecting garbage!", "blue");
  if (globalOptions.stopTurncount !== null) {
    print(`Stopping in ${globalOptions.stopTurncount - myTurncount()}`, "blue");
  }
  print();

  setAutoAttack(0);
  cliExecute("mood apathetic");
  cliExecute("ccs garbo");

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
}
