import {
  booleanModifier,
  buy,
  cliExecute,
  getCampground,
  getCounters,
  guildStoreAvailable,
  inebrietyLimit,
  itemAmount,
  myAdventures,
  myClass,
  myGardenType,
  myInebriety,
  myTurncount,
  print,
  putCloset,
  retrieveItem,
  reverseNumberology,
  runChoice,
  setAutoAttack,
  setProperty,
  toItem,
  use,
  useFamiliar,
  visitUrl,
  xpath,
} from "kolmafia";
import {
  $class,
  $effect,
  $item,
  $items,
  $location,
  $monster,
  $skill,
  adventureMacro,
  adventureMacroAuto,
  get,
  have,
  setDefaultMaximizeOptions,
  sinceKolmafiaRevision,
  SourceTerminal,
} from "libram";
import { Macro, withMacro } from "./combat";
import {
  cheat,
  configureGear,
  configureMisc,
  dailyBuffs,
  gin,
  horse,
  latte,
  pickTea,
  prepFamiliars,
  volcanoDailies,
  voterSetup,
} from "./dailies";
import { runDiet } from "./diet";
import { freeFightFamiliar, meatFamiliar } from "./familiar";
import { dailyFights, freeFights, safeRestore } from "./fights";
import { questStep, prepWandererZone, physicalImmuneMacro, withProperties } from "./lib";
import { meatMood } from "./mood";
import {
  familiarWaterBreathingEquipment,
  freeFightOutfit,
  meatOutfit,
  Requirement,
  waterBreathingEquipment,
} from "./outfit";
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

function dailySetup() {
  voterSetup();
  configureGear();
  horse();
  latte();
  prepFamiliars();
  dailyBuffs();
  configureMisc();
  volcanoDailies();
  cheat();
  gin();
  pickTea();

  retrieveItem($item`Half a Purse`);
  putCloset(itemAmount($item`hobo nickel`), $item`hobo nickel`);
  putCloset(itemAmount($item`sand dollar`), $item`sand dollar`);
}

function barfTurn() {
  if (have($effect`beaten up`))
    throw "Hey, you're beaten up, and that's a bad thing. Lick your wounds, handle your problems, and run me again when you feel ready.";
  if (SourceTerminal.have()) {
    SourceTerminal.educate([$skill`Extract`, $skill`Digitize`]);
  }
  if (
    have($item`unwrapped retro superhero cape`) &&
    (get("retroCapeSuperhero") !== "robot" || get("retroCapeWashingInstructions") !== "kill")
  ) {
    cliExecute("retrocape robot kill");
  }

  // a. set up familiar
  useFamiliar(meatFamiliar());

  const embezzlerUp = getCounters("Digitize Monster", 0, 0).trim() !== "";
  let location = embezzlerUp ? prepWandererZone() : $location`Barf Mountain`;
  if (
    !get("_envyfishEggUsed") &&
    (booleanModifier("Adventure Underwater") || waterBreathingEquipment.some(have)) &&
    (booleanModifier("Underwater Familiar") || familiarWaterBreathingEquipment.some(have)) &&
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
  } else if (
    have($item`protonic accelerator pack`) &&
    get("questPAGhost") !== "unstarted" &&
    ghostLocation
  ) {
    useFamiliar(freeFightFamiliar());
    freeFightOutfit([new Requirement([], { forceEquip: $items`protonic accelerator pack` })]);
    adventureMacro(ghostLocation, physicalImmuneMacro);
  } else if (
    have($item`I Voted!" sticker`) &&
    getCounters("Vote", 0, 0) !== "" &&
    get("_voteFreeFights") < 3
  ) {
    useFamiliar(freeFightFamiliar());
    freeFightOutfit([new Requirement([], { forceEquip: $items`I Voted!" sticker` })]);
    adventureMacroAuto(prepWandererZone(), Macro.step(physicalImmuneMacro).meatKill());
  } else {
    adventureMacroAuto(
      location,
      Macro.externalIf(
        underwater,
        Macro.if_(
          `monsterid ${$monster`knob goblin embezzler`.id}`,
          Macro.item("pulled green taffy")
        )
      ).meatKill()
    );
  }

  if (
    Object.keys(reverseNumberology()).includes("69") &&
    get("_universeCalculated") < get("skillLevel144")
  ) {
    cliExecute("numberology 69");
  }
}

export const globalOptions: { ascending: boolean; stopTurncount: number | null } = {
  stopTurncount: null,
  ascending: false,
};

export function canContinue() {
  return (
    myAdventures() > 0 &&
    (globalOptions.stopTurncount === null || myTurncount() < globalOptions.stopTurncount)
  );
}

export function main(argString = "") {
  sinceKolmafiaRevision(20767);

  if (get("valueOfAdventure") <= 3500) {
    throw `Your valueOfAdventure is set to ${get(
      "valueOfAdventure"
    )}, which is too low for barf farming to be worthwhile. If you forgot to set it, use "set valueOfAdventure = XXXX" to set it to your marginal turn meat value.`;
  }
  if (get("valueOfAdventure") >= 10000) {
    throw `Your valueOfAdventure is set to ${get(
      "valueOfAdventure"
    )}, which is definitely incorrect. Please set it to your reliable marginal turn value.`;
  }

  const args = argString.split(" ");
  for (const arg of args) {
    if (arg.match(/\d+/)) {
      globalOptions.stopTurncount = myTurncount() + parseInt(arg, 10);
    }
    if (arg.match(/ascend/)) {
      globalOptions.ascending = true;
    }
  }
  const gardens = $items`packet of pumpkin seeds, Peppermint Pip Packet, packet of dragon's teeth, packet of beer seeds, packet of winter seeds, packet of thanksgarden seeds, packet of tall grass seeds, packet of mushroom spores`;
  const startingGarden = gardens.find((garden) =>
    Object.getOwnPropertyNames(getCampground()).includes(garden.name)
  );

  const aaBossFlag =
    xpath(
      visitUrl("account.php?tab=combat"),
      `//*[@id="opt_flag_aabosses"]/label/input[@type='checkbox']@checked`
    )[0] === "checked"
      ? 1
      : 0;

  try {
    print("Collecting garbage!", "blue");
    if (globalOptions.stopTurncount !== null) {
      print(`Stopping in ${globalOptions.stopTurncount - myTurncount()}`, "blue");
    }
    print();

    if (have($item`packet of tall grass seeds`) && myGardenType() !== "grass")
      use($item`packet of tall grass seeds`);

    setAutoAttack(0);
    visitUrl(`account.php?actions[]=flag_aabosses&flag_aabosses=1&action=Update`, true);
    withProperties(
      [
        {
          name: "battleAction",
          value: "custom combat script",
        },
        {
          name: "autoSatisfyWithMall",
          value: true,
        },
        {
          name: "autoSatisfyWithNPCs",
          value: true,
        },
        {
          name: "autoSatisfyWithCoinmasters",
          value: true,
        },
        {
          name: "dontStopForCounters",
          value: true,
        },
        {
          name: "maximizerFoldables",
          value: false,
        },
      ],
      () => {
        cliExecute("mood apathetic");
        cliExecute("ccs garbo");
        safeRestore();

        if (questStep("questM23Meatsmith") === -1) {
          visitUrl("shop.php?whichshop=meatsmith&action=talk");
          runChoice(1);
        }
        if (questStep("questM24Doc") === -1) {
          visitUrl("shop.php?whichshop=doc&action=talk");
          runChoice(1);
        }
        if (questStep("questM25Armorer") === -1) {
          visitUrl("shop.php?whichshop=armory&action=talk");
          runChoice(1);
        }
        if (
          myClass() === $class`Seal Clubber` &&
          !have($skill`Furious Wallop`) &&
          guildStoreAvailable()
        ) {
          visitUrl("guild.php?action=buyskill&skillid=32", true);
        }
        const stashItems = $items`repaid diaper, buddy bjorn, crown of thrones, naughty origami pasties`;
        if (
          myInebriety() <= inebrietyLimit() &&
          (myClass() !== $class`seal clubber` || !have($skill`furious wallop`))
        )
          stashItems.push($item`haiku katana`);
        // FIXME: Dynamically figure out pointer ring approach.
        withStash(stashItems, () => {
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
    );
  } finally {
    visitUrl(`account.php?actions[]=flag_aabosses&flag_aabosses=${aaBossFlag}&action=Update`, true);
    if (startingGarden && have(startingGarden)) use(startingGarden);
    if (questStep("_questPartyFair") > 0) {
      const partyFairInfo = get("_questPartyFairProgress").split(" ");
      print(
        `Gerald/ine wants ${partyFairInfo[0]} ${toItem(partyFairInfo[1]).plural}, please!`,
        "blue"
      );
    }
  }
}
