import {
  adv1,
  booleanModifier,
  buy,
  changeMcd,
  cliExecute,
  getCampground,
  getClanLounge,
  getCounters,
  haveFamiliar,
  haveSkill,
  itemAmount,
  maximize,
  myAdventures,
  myClass,
  myGardenType,
  myPrimestat,
  myThrall,
  myTurncount,
  numericModifier,
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
  Bandersnatch,
  get,
  have,
  setDefaultMaximizeOptions,
  sinceKolmafiaRevision,
  SongBoom,
  SourceTerminal,
} from "libram";
import { Macro, withMacro } from "./combat";
import { runDiet } from "./diet";
import { freeFightFamiliar, meatFamiliar } from "./familiar";
import { dailyFights, freeFights, safeRestore } from "./fights";
import { ensureEffect, questStep, setChoice, voterSetup, prepWandererZone } from "./lib";
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
  voterSetup();
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

  const latte = $item`latte lovers member's mug`;
  if (have(latte) && questStep("questL02Larva") > -1 && questStep("questL11MacGuffin") > -1) {
    if (
      numericModifier(latte, "Familiar Weight") !== 5 ||
      numericModifier(latte, "Meat Drop") !== 40
    ) {
      if (
        !get("latteUnlocks").includes("cajun") &&
        (haveFamiliar($familiar`frumious bandersnatch`) ||
          haveFamiliar($familiar`pair of stomping boots`)) &&
        Bandersnatch.getRemainingRunaways() > 0
      ) {
        const runFam = haveFamiliar($familiar`pair of stomping boots`)
          ? $familiar`pair of stomping boots`
          : $familiar`frumious bandersnatch`;
        useFamiliar(runFam);
        maximize("familiar weight, +equip latte lovers member's mug", false);
        if (runFam === $familiar`frumious bandersnatch`) ensureEffect($effect`ode to booze`);
        Macro.step("runaway").setAutoAttack();
        setChoice(923, 1);
        setChoice(924, 1);
        while (!get("latteUnlocks").includes("cajun") && Bandersnatch.getRemainingRunaways() > 0) {
          adv1($location`the black forest`, -1, "");
        }
      }
      if (
        !get("latteUnlocks").includes("rawhide") &&
        (haveFamiliar($familiar`frumious bandersnatch`) ||
          haveFamiliar($familiar`pair of stomping boots`)) &&
        Bandersnatch.getRemainingRunaways() > 0
      ) {
        const runFam = haveFamiliar($familiar`pair of stomping boots`)
          ? $familiar`pair of stomping boots`
          : $familiar`frumious bandersnatch`;
        useFamiliar(runFam);
        maximize("familiar weight, +equip latte lovers member's mug", false);
        if (runFam === $familiar`frumious bandersnatch`) ensureEffect($effect`ode to booze`);
        Macro.step("runaway").setAutoAttack();
        setChoice(502, 2);
        setChoice(505, 2);
        while (
          !get("latteUnlocks").includes("rawhide") &&
          Bandersnatch.getRemainingRunaways() > 0
        ) {
          adv1($location`the spooky forest`, -1, "");
        }
      }
      if (
        get("latteUnlocks").includes("cajun") &&
        get("latteUnlocks").includes("rawhide") &&
        get("_latteRefillsUsed") < 3
      ) {
        const latteIngredients =
          "cajun rawhide " +
          (get("latteUnlocks").includes("carrot")
            ? "carrot"
            : myPrimestat() === $stat`muscle`
            ? "vanilla"
            : myPrimestat() === $stat`mysticality`
            ? "pumpkin spice"
            : "cinnamon");
        cliExecute(`latte refill ${latteIngredients}`);
      }
    }
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

  while (
    get<Monster>("lastCopyableMonster") === $monster`Knob Goblin Embezzler` &&
    have($item`backup camera`) &&
    get<number>("_backUpUses") < 11
  ) {
    if (have($effect`beaten up`))
      throw "Hey, you're beaten up, and that's a bad thing. Lick your wounds, handle your problems, and run me again when you feel ready.";
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
  let location = embezzlerUp ? prepWandererZone() : $location`Barf Mountain`;
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
  } else if (
    have($item`protonic accelerator pack`) &&
    get("questPAGhost") !== "unstarted" &&
    ghostLocation
  ) {
    useFamiliar(freeFightFamiliar());
    freeFightOutfit([new Requirement([], { forceEquip: $items`protonic accelerator pack` })]);
    adventureMacro(
      ghostLocation,
      Macro.trySkill("curse of weaksauce")
        .trySkill("shoot ghost")
        .trySkill("shoot ghost")
        .trySkill("shoot ghost")
        .trySkill("trap ghost")
    );
  } else if (
    have($item`I Voted!" sticker`) &&
    getCounters("Vote", 0, 0) !== "" &&
    get("_voteFreeFights") < 3
  ) {
    useFamiliar(freeFightFamiliar());
    freeFightOutfit([new Requirement([], { forceEquip: $items`I Voted!" sticker` })]);
    adventureMacroAuto(
      $location`noob cave`,
      Macro.if_(
        `monsterid ${$monster`Angry ghost`.id}`,
        Macro.skill("saucestorm").repeat()
      ).meatKill()
    );
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
    setProperty("battleAction", "custom combat script");
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
    if (startingGarden && have(startingGarden)) use(startingGarden);
  }
}
