import {
  buy,
  cliExecute,
  equip,
  faxbot,
  getCounters,
  haveFamiliar,
  inebrietyLimit,
  itemAmount,
  myAdventures,
  myClass,
  myInebriety,
  myThrall,
  myTurncount,
  print,
  putCloset,
  retrieveItem,
  runChoice,
  setAutoAttack,
  toInt,
  totalTurnsPlayed,
  use,
  useFamiliar,
  useSkill,
  visitUrl,
} from "kolmafia";
import {
  $class,
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
  get,
  have,
  maximizeCached,
  setDefaultMaximizeOptions,
  SongBoom,
  SourceTerminal,
} from "libram";
import { Macro, withMacro } from "./combat";
import { baseMeat, meatMood } from "./mood";
import { freeFightOutfit } from "./outfit";

// Max price for tickets. You should rethink whether Barf is the best place if they're this expensive.
const TICKET_MAX_PRICE = 500000;

function ensureBarfAccess() {
  if (!(get("stenchAirportAlways") || get("_stenchAirportToday"))) {
    const ticket = $item`one-day ticket to Dinseylandfill`;
    // TODO: Get better item acquisition logic that e.g. checks own mall store.
    if (!have(ticket)) buy(1, ticket, TICKET_MAX_PRICE);
    use(ticket);
  }
}

function chooseFamiliar() {
  if (
    myInebriety() > inebrietyLimit() &&
    have($familiar`Trick-or-Treating Tot`) &&
    have($item`li'l pirate costume`)
  ) {
    return $familiar`Trick-or-Treating Tot`;
  } else {
    for (const familiar of $familiars`Robortender, Hobo Monkey, Cat Burglar, Leprechaun`) {
      if (haveFamiliar(familiar)) return familiar;
    }
  }
  throw new Error("No good Barf familiars!");
}

function dailySetup() {
  if (have($familiar`Cornbeefadon`) && !have($item`amulet coin`)) {
    useFamiliar($familiar`Cornbeefadon`);
    use($item`box of Familiar Jacks`);
  }

  if (have($item`portable pantogram`) && !have($item`pantogram pants`)) {
    retrieveItem(1, $item`ten-leaf clover`);
    retrieveItem(1, $item`porquoise`);
    cliExecute("pantogram high meat|clover");
  }

  if (have($item`Fourth of May Cosplay Saber`) && get("_saberMod") === 0) {
    // Get familiar weight.
    visitUrl("main.php?action=may4");
    runChoice(4);
  }

  SongBoom.setSong("Total Eclipse of Your Meat");
  SourceTerminal.educate([$skill`Extract`, $skill`Digitize`]);

  if (have($familiar`Robortender`)) {
    for (const drink of $items`Newark, drive-by shooting, Feliz Navidad, single entendre`) {
      if (get("_roboDrinks").includes(drink.name)) continue;
      if (itemAmount(drink) === 0) buy(1, drink, 150000);
      visitUrl(`inventory.php?action=robooze&which=1&whichitem=${toInt(drink)}`);
    }
  }

  if (myClass() === $class`Pastamancer` && myThrall() !== $thrall`Lasagmbie`) {
    useSkill($skill`Bind Lasagmbie`);
  }

  putCloset(itemAmount($item`hobo nickel`), $item`hobo nickel`);
  putCloset(itemAmount($item`sand dollar`), $item`sand dollar`);
}

function dailyFights() {
  const embezzler = $monster`Knob Goblin embezzler`;
  if (
    SourceTerminal.have() &&
    SourceTerminal.getDigitizeMonster() !== embezzler &&
    !get("_photocopyUsed")
  ) {
    if (!have($item`photocopied monster`) || get("photocopyMonster") !== embezzler) {
      faxbot(embezzler, "CheeseFax");
    }
    // TODO: Prof copies, spooky putty copies, ice sculpture if worth, etc.
    if (SourceTerminal.getDigitizeMonster() === null) {
      if (!get("_iceSculptureUsed")) retrieveItem($item`unfinished ice sculpture`);
      if (!get("_cameraUsed")) retrieveItem($item`4-d camera`);
      if (!get("_envyfishEggUsed")) retrieveItem($item`pulled green taffy`);
      withMacro(
        Macro.tryHaveSkill("Digitize")
          .externalIf(!get("_iceSculptureUsed"), Macro.item("unfinished ice sculpture"))
          .externalIf(!get("_cameraUsed"), Macro.item("4-d camera"))
          .meatKill(),
        () => use($item`photocopied monster`)
      );
    }

    if (getCounters("Digitize Monster", 0, 100).trim() === "") {
      if (have($item`packet of mushroom spores`)) use($item`packet of mushroom spores`);
      // adventure in mushroom garden to start digitize timer.
      freeFightOutfit();
      useFamiliar(chooseFamiliar());
      adventureMacro($location`Your Mushroom Garden`, Macro.meatKill());
    }

    if (have($familiar`Pocket Professor`) && get("_pocketProfessorLectures") < 10) {
      // now we can do prof copies.
      useFamiliar($familiar`Pocket Professor`);
      equip($item`amulet coin`);
      withMacro(Macro.trySkill("Lecture on Relativity").meatKill(), () =>
        use($item`ice sculpture`)
      );
    }

    /* if (!get("_envyfishEggUsed")) {
      // now fight one underwater
      use($item`fishy pipe`);
      if (getCounters("Digitize Monster", 0, 0).trim() !== "Digitize Monster") {
        throw new Error("Something went wrong with digitize.");
      }
    } */
  }
}

function getKramcoWandererChance() {
  const fights = get("_sausageFights");
  const lastFight = get("_lastSausageMonsterTurn");
  const totalTurns = totalTurnsPlayed();
  if (fights < 1) {
    return lastFight === totalTurns && myTurncount() < 1 ? 0.5 : 1.0;
  }
  const turnsSinceLastFight = totalTurns - lastFight;
  return Math.min(1.0, (turnsSinceLastFight + 1) / (5 + fights * 3 + Math.max(0, fights - 5) ** 3));
}

function barfTurn() {
  // a. set up familiar
  const familiar = chooseFamiliar();
  useFamiliar(familiar);

  // b. set up outfit? just keep on constant one for now
  maximizeCached(
    [
      `${(baseMeat / 100).toFixed(2)} Meat Drop`,
      "0.72 Item Drop",
      "400 Bonus lucky gold ring",
      "300 Bonus mafia thumb ring",
    ],
    {
      forceEquip: [
        ...(myInebriety() > inebrietyLimit()
          ? $items`Drunkula's wineglass`
          : getKramcoWandererChance() > 0.05
          ? $items`Kramco™ Sausage-o-Matic, ice nine, mafia pointer finger ring`
          : $items`ice nine, mafia pointer finger ring`),
      ],
      preventEquip: $items`broken champagne bottle, unwrapped retro superhero cape`,
    }
  );

  if (myInebriety() <= inebrietyLimit()) equip($item`unwrapped retro superhero cape`);
  if (
    have($item`unwrapped retro superhero cape`) &&
    !(get("retroCapeSuperhero") === "robot" && get("retroCapeWashingInstructions") === "kill")
  ) {
    print(get("retroCapeSuperhero"));
    print(get("retroCapeWashingInstructions"));
    // Set up for critical.
    cliExecute("retrocape robot kill");
  }

  // c. set up mood stuff
  meatMood().execute(myAdventures() * 1.04 + 50);

  // d. run adventure
  adventureMacroAuto($location`Barf Mountain`, Macro.meatKill());
}

export function main(args = "") {
  // TODO: How do we handle Synth? Needs to be integrated with diet stuff.
  // Similar for jumping horseradish etc.

  // 0. diet stuff.

  // 1. get a ticket
  ensureBarfAccess();

  // 2. make an outfit (amulet coin, pantogram, etc), misc other stuff (VYKEA, songboom, robortender drinks)
  dailySetup();

  setDefaultMaximizeOptions({
    preventEquip: $items`broken champagne bottle`,
  });

  // 4. do some embezzler stuff
  dailyFights();

  // 5. burn turns at barf
  try {
    while (myAdventures() > 0) {
      barfTurn();
    }
  } finally {
    setAutoAttack(0);
  }
}
