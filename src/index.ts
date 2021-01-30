import {
  buy,
  cliExecute,
  faxbot,
  haveFamiliar,
  maximize,
  myAdventures,
  retrieveItem,
  toInt,
  use,
  useFamiliar,
  visitUrl,
} from "kolmafia";
import {
  $familiar,
  $familiars,
  $item,
  $items,
  $location,
  $monster,
  adventureMacroAuto,
  get,
  have,
  SourceTerminal,
} from "libram";
import { Macro } from "./combat";
import { baseMeat, meatMood } from "./mood";

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
  for (const familiar of $familiars`Robortender, Hobo Monkey, Cat Burglar, Leprechaun`) {
    if (haveFamiliar(familiar)) return familiar;
  }
  throw new Error("No good Barf familiars!");
}

export function main(args = "") {
  // TODO: How do we handle Synth? Needs to be integrated with diet stuff.
  // Similar for jumping horseradish etc.

  // 0. diet stuff.

  // 1. get a ticket
  ensureBarfAccess();

  // 2. make an outfit (amulet coin, pantogram, etc)

  // 3. misc other stuff (VYKEA, songboom, robortender drinks, cape setup if necessary)
  cliExecute("retrocape robot kill"); // set up Precision Shot
  if (get("boomBoxSong") != "Total Eclipse of Your Meat") {
    cliExecute("boombox meat");
  }
  if (have($familiar`Robortender`)) {
    for (const drink of $items`Newark, drive-by shooting, Feliz Navidad, single entendre`) {
      retrieveItem(drink);
      visitUrl(`inventory.php?action=robooze&which=1&whichitem=${toInt(drink)}`);
    }
  }

  // 4. do some embezzler stuff
  const embezzler = $monster`Knob Goblin embezzler`;
  if (
    SourceTerminal.have() &&
    get("_sourceTerminalDigitizeMonster") !== embezzler &&
    !get("_photocopyUsed")
  ) {
    if (!have($item`photocopied monster`) || get("photocopyMonster") !== embezzler) {
      faxbot(embezzler, "CheeseFax");
    }
    // TODO: Prof copies, spooky putty copies, ice sculpture if worth, etc.
    Macro.skill("Digitize").meatKill();
  }

  // 5. burn turns at barf
  while (myAdventures() > 0) {
    // a. set up familiar
    const familiar = chooseFamiliar();
    useFamiliar(familiar);

    // b. set up outfit? just keep on constant one for now
    maximize(
      [
        `${(baseMeat / 100).toFixed(2)} Meat Drop`,
        "0.72 Item Drop",
        "400 Bonus lucky gold ring",
        "300 Bonus mafia thumb ring",
        "Equip mafia pointer finger ring",
        "Equip unwrapped retro superhero cape",
        "Equip love",
      ].join(", "),
      false
    );

    // c. set up mood stuff
    meatMood().execute();
    // c. run adventure
    // TODO: figure out critical hit stuff.
    adventureMacroAuto($location`Barf Mountain`, Macro.skill("Sing Along", "Saucestorm"));
  }
}
