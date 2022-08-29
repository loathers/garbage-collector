import {
  availableAmount,
  booleanModifier,
  buy,
  canAdventure,
  cliExecute,
  currentRound,
  eat,
  equip,
  getCampground,
  getClanName,
  getCounters,
  guildStoreAvailable,
  inebrietyLimit,
  Item,
  itemAmount,
  maximize,
  myAdventures,
  myClass,
  myGardenType,
  myId,
  myInebriety,
  myLevel,
  myTurncount,
  print,
  putStash,
  retrieveItem,
  runChoice,
  runCombat,
  setAutoAttack,
  toInt,
  totalTurnsPlayed,
  toUrl,
  use,
  useFamiliar,
  useSkill,
  visitUrl,
  xpath,
} from "kolmafia";
import {
  $class,
  $classes,
  $coinmaster,
  $effect,
  $item,
  $items,
  $location,
  $monster,
  $skill,
  $slot,
  $slots,
  adventureMacro,
  adventureMacroAuto,
  clamp,
  Clan,
  ensureEffect,
  get,
  getFoldGroup,
  have,
  haveInCampground,
  JuneCleaver,
  property,
  Requirement,
  set,
  setDefaultMaximizeOptions,
  sinceKolmafiaRevision,
  SourceTerminal,
} from "libram";
import { Macro, withMacro } from "./combat";
import { computeDiet, consumeDiet, runDiet } from "./diet";
import { barfFamiliar, freeFightFamiliar, meatFamiliar } from "./familiar";
import { dailyFights, deliverThesisIfAble, freeFights, printEmbezzlerLog } from "./fights";
import {
  bestJuneCleaverOption,
  checkGithubVersion,
  embezzlerLog,
  globalOptions,
  HIGHLIGHT,
  kramcoGuaranteed,
  printHelpMenu,
  printLog,
  propertyManager,
  questStep,
  safeRestore,
  setChoice,
  steveAdventures,
  userConfirmDialog,
} from "./lib";
import { meatMood } from "./mood";
import postCombatActions from "./post";
import {
  familiarWaterBreathingEquipment,
  freeFightOutfit,
  meatOutfit,
  tryFillLatte,
  waterBreathingEquipment,
} from "./outfit";
import { stashItems, withStash, withVIPClan } from "./clan";
import { completeBarfQuest, dailySetup, postFreeFightDailySetup } from "./dailies";
import { estimatedTurns } from "./embezzler";
import { determineDraggableZoneAndEnsureAccess, digitizedMonstersRemaining } from "./wanderer";
import { potionSetup } from "./potions";
import { garboAverageValue, printGarboSession, startSession } from "./session";
import { yachtzeeChain } from "./yachtzee";

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
    print("Disposing of garbage.", HIGHLIGHT);
    retrieveItem($item`bag of park garbage`);
    visitUrl("place.php?whichplace=airport_stench&action=airport3_tunnels");
    runChoice(6);
    cliExecute("refresh inv");
  }
}

function barfTurn() {
  const startTurns = totalTurnsPlayed();

  if (SourceTerminal.have()) {
    SourceTerminal.educate([$skill`Extract`, $skill`Digitize`]);
  }

  tryFillLatte();

  const steveRoom = get("nextSpookyravenStephenRoom");
  const ghostLocation = get("ghostLocation");
  if (
    totalTurnsPlayed() % 37 === 0 &&
    totalTurnsPlayed() !== get("lastLightsOutTurn") &&
    steveRoom &&
    steveRoom !== ghostLocation &&
    canAdventure(steveRoom)
  ) {
    const fightingSteve = steveRoom === $location`The Haunted Laboratory`;
    if (fightingSteve) {
      useFamiliar(meatFamiliar());
      meatOutfit(true);
    }
    const plan = steveAdventures.get(steveRoom);
    if (plan) {
      withMacro(
        Macro.if_($monster`Stephen Spookyraven`, Macro.basicCombat()).abort(),
        () => {
          visitUrl(toUrl(steveRoom));
          for (const choiceValue of plan) {
            runChoice(choiceValue);
          }
          if (fightingSteve || currentRound()) runCombat();
        },
        true
      );
    }
  }

  const embezzlerUp = getCounters("Digitize Monster", 0, 0).trim() !== "";

  // a. set up mood stuff
  meatMood().execute(estimatedTurns());

  safeRestore(); // get enough mp to use summer siesta and enough hp to not get our ass kicked

  // b. check for wanderers, and do them
  if (have($item`envyfish egg`) && !get("_envyfishEggUsed")) {
    meatOutfit(true);
    withMacro(Macro.meatKill(), () => use($item`envyfish egg`));
  } else if (
    myInebriety() <= inebrietyLimit() &&
    have($item`protonic accelerator pack`) &&
    get("questPAGhost") !== "unstarted" &&
    ghostLocation
  ) {
    useFamiliar(freeFightFamiliar(true));
    freeFightOutfit(
      new Requirement(ghostLocation === $location`The Icy Peak` ? ["Cold Resistance 5 min"] : [], {
        forceEquip: $items`protonic accelerator pack`,
      })
    );
    adventureMacro(ghostLocation, Macro.ghostBustin());
  } else if (
    myInebriety() <= inebrietyLimit() &&
    have($item`"I Voted!" sticker`) &&
    totalTurnsPlayed() % 11 === 1 &&
    get("lastVoteMonsterTurn") < totalTurnsPlayed() &&
    get("_voteFreeFights") < 3
  ) {
    useFamiliar(freeFightFamiliar(true));
    freeFightOutfit(new Requirement([], { forceEquip: $items`"I Voted!" sticker` }));
    adventureMacroAuto(determineDraggableZoneAndEnsureAccess(), Macro.basicCombat());
  } else if (myInebriety() <= inebrietyLimit() && !embezzlerUp && kramcoGuaranteed()) {
    useFamiliar(freeFightFamiliar(true));
    freeFightOutfit(new Requirement([], { forceEquip: $items`Kramco Sausage-o-Matic™` }));
    adventureMacroAuto(determineDraggableZoneAndEnsureAccess(), Macro.basicCombat());
  } else if (
    myInebriety() <= inebrietyLimit() &&
    !embezzlerUp &&
    have($item`cursed magnifying glass`) &&
    get("cursedMagnifyingGlassCount") === 13 &&
    get("_voidFreeFights") < 5
  ) {
    useFamiliar(freeFightFamiliar(true));
    freeFightOutfit(new Requirement([], { forceEquip: $items`cursed magnifying glass` }));
    adventureMacroAuto(determineDraggableZoneAndEnsureAccess(), Macro.basicCombat());
  } else {
    // c. set up familiar
    const location = embezzlerUp
      ? !get("_envyfishEggUsed") &&
        myLevel() >= 11 &&
        (booleanModifier("Adventure Underwater") ||
          waterBreathingEquipment.some((item) => have(item))) &&
        (booleanModifier("Underwater Familiar") ||
          familiarWaterBreathingEquipment.some((item) => have(item))) &&
        (have($effect`Fishy`) || (have($item`fishy pipe`) && !get("_fishyPipeUsed"))) &&
        !have($item`envyfish egg`)
        ? $location`The Briny Deeps`
        : determineDraggableZoneAndEnsureAccess()
      : $location`Barf Mountain`;

    const underwater = location === $location`The Briny Deeps`;

    if (underwater) {
      // now fight one underwater
      if (get("questS01OldGuy") === "unstarted") {
        visitUrl("place.php?whichplace=sea_oldman&action=oldman_oldman");
      }
      retrieveItem($item`pulled green taffy`);
      if (!have($effect`Fishy`)) use($item`fishy pipe`);
    } else if (embezzlerUp) useFamiliar(meatFamiliar());
    else useFamiliar(barfFamiliar());

    // d. get dressed
    meatOutfit(embezzlerUp, undefined, underwater);

    if (
      !embezzlerUp &&
      myInebriety() > inebrietyLimit() &&
      globalOptions.ascending &&
      clamp(myAdventures() - digitizedMonstersRemaining(), 1, myAdventures()) <=
        availableAmount($item`Map to Safety Shelter Grimace Prime`)
    ) {
      const choiceToSet =
        availableAmount($item`distention pill`) <
        availableAmount($item`synthetic dog hair pill`) +
          availableAmount($item`Map to Safety Shelter Grimace Prime`)
          ? 1
          : 2;
      setChoice(536, choiceToSet);
      ensureEffect($effect`Transpondent`);
      use($item`Map to Safety Shelter Grimace Prime`);
    } else {
      if (
        get("dinseyRollercoasterNext") &&
        have($item`lube-shoes`) &&
        location === $location`Barf Mountain`
      ) {
        equip($slot`acc3`, $item`lube-shoes`);
      }
      adventureMacroAuto(
        location,
        Macro.externalIf(
          underwater,
          Macro.if_($monster`Knob Goblin Embezzler`, Macro.item($item`pulled green taffy`))
        ).meatKill(),
        Macro.if_(
          `(monsterid ${$monster`Knob Goblin Embezzler`.id}) && !gotjump && !(pastround 2)`,
          Macro.externalIf(underwater, Macro.item($item`pulled green taffy`)).meatKill()
        ).abort()
      );
      completeBarfQuest();
    }
  }

  if (myAdventures() === 1 + globalOptions.saveTurns && myInebriety() <= inebrietyLimit()) {
    deliverThesisIfAble();

    if (
      have($item`Kramco Sausage-o-Matic™`) &&
      (have($item`magical sausage`) || have($item`magical sausage casing`)) &&
      get("_sausagesEaten") < 23
    ) {
      const available = clamp(
        23 - get("_sausagesEaten"),
        0,
        itemAmount($item`magical sausage`) + itemAmount($item`magical sausage casing`)
      );
      eat(available, $item`magical sausage`);
    }
  }

  if (
    have($item`designer sweatpants`) &&
    myAdventures() === 1 + globalOptions.saveTurns &&
    !globalOptions.noDiet
  ) {
    while (get("_sweatOutSomeBoozeUsed", 0) < 3 && get("sweat", 0) >= 25 && myInebriety() > 0) {
      useSkill($skill`Sweat Out Some Booze`);
    }
    consumeDiet(computeDiet().sweatpants(), "SWEATPANTS");
  }

  if (totalTurnsPlayed() - startTurns === 1 && get("lastEncounter") === "Knob Goblin Embezzler") {
    if (embezzlerUp) {
      embezzlerLog.digitizedEmbezzlersFought++;
      embezzlerLog.sources.push("Digitize");
    } else {
      embezzlerLog.initialEmbezzlersFought++;
      embezzlerLog.sources.push("Unknown Source");
    }
  }
}

export function canContinue(): boolean {
  return (
    myAdventures() > globalOptions.saveTurns &&
    (globalOptions.stopTurncount === null || myTurncount() < globalOptions.stopTurncount)
  );
}

const players = new Map([
  ["1267204", `"Finally."`],
  ["2284327", "KoL is not an incremental game."],
]);

export function main(argString = ""): void {
  sinceKolmafiaRevision(26634);
  const errMessage = players.get(myId());
  if (errMessage) throw new Error(errMessage);

  print(`${process.env.GITHUB_REPOSITORY}@${process.env.GITHUB_SHA}`);
  const forbiddenStores = property.getString("forbiddenStores").split(",");
  if (!forbiddenStores.includes("3408540")) {
    // Van & Duffel's Baleet Shop
    forbiddenStores.push("3408540");
    set("forbiddenStores", forbiddenStores.join(","));
  }

  if (get("garbo_autoUserConfirm", false)) {
    print(
      "I have set auto-confirm to true and accept all ramifications that come with that.",
      "red"
    );
  }

  if (
    !$classes`Seal Clubber, Turtle Tamer, Pastamancer, Sauceror, Disco Bandit, Accordion Thief, Cow Puncher, Snake Oiler, Beanslinger`.includes(
      myClass()
    )
  ) {
    throw new Error(
      "Garbo does not support non-WOL avatar classes. It barely supports WOL avatar classes"
    );
  }

  if (!get("garbo_skipAscensionCheck", false) && (!get("kingLiberated") || myLevel() < 13)) {
    const proceedRegardless = userConfirmDialog(
      "Looks like your ascension may not be done yet. Running garbo in an unintended character state can result in serious injury and even death. Are you sure you want to garbologize?",
      true
    );
    if (!proceedRegardless) {
      throw new Error("User interrupt requested. Stopping Garbage Collector.");
    }
  }

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
      const adventureCount = parseInt(arg, 10);
      if (adventureCount >= 0) {
        globalOptions.stopTurncount = myTurncount() + adventureCount;
      } else {
        globalOptions.saveTurns = -adventureCount;
      }
    } else if (arg.match(/ascend/)) {
      globalOptions.ascending = true;
    } else if (arg.match(/nobarf/)) {
      globalOptions.noBarf = true;
    } else if (arg.match(/help/i)) {
      printHelpMenu();
      return;
    } else if (arg.match(/simdiet/)) {
      globalOptions.simulateDiet = true;
    } else if (arg.match(/nodiet/)) {
      globalOptions.noDiet = true;
    } else if (arg.match(/yachtzeechain/)) {
      globalOptions.yachtzeeChain = true;
    } else if (arg.match(/version/i)) {
      checkGithubVersion();
      return;
    } else if (arg) {
      print(`Invalid argument ${arg} passed. Run garbo help to see valid arguments.`, "red");
      return;
    }
  }

  if (stashItems.length > 0) {
    if (
      userConfirmDialog(
        `Garbo has detected that you have the following items still out of the stash from a previous run of garbo: ${stashItems
          .map((item) => item.name)
          .join(",")}. Would you like us to return these to the stash now?`,
        true
      )
    ) {
      const clanIdOrName = get("garbo_stashClan", "none");
      const parsedClanIdOrName =
        clanIdOrName !== "none"
          ? clanIdOrName.match(/^\d+$/)
            ? parseInt(clanIdOrName)
            : clanIdOrName
          : null;

      if (parsedClanIdOrName) {
        Clan.with(parsedClanIdOrName, () => {
          for (const item of [...stashItems]) {
            if (getFoldGroup(item).some((item) => have(item))) cliExecute(`fold ${item}`);
            const retrieved = retrieveItem(item);
            if (
              item === $item`Spooky Putty sheet` &&
              !retrieved &&
              have($item`Spooky Putty monster`)
            ) {
              continue;
            }
            print(`Returning ${item} to ${getClanName()} stash.`, HIGHLIGHT);
            if (putStash(item, 1)) stashItems.splice(stashItems.indexOf(item), 1);
          }
        });
      } else throw new Error("Error: No garbo_stashClan set.");
    } else {
      stashItems.splice(0, stashItems.length);
    }
  }

  startSession();
  if (!globalOptions.noBarf && !globalOptions.simulateDiet) {
    ensureBarfAccess();
  }
  if (globalOptions.simulateDiet) {
    propertyManager.set({
      logPreferenceChange: true,
      autoSatisfyWithMall: true,
      autoSatisfyWithNPCs: true,
      autoSatisfyWithCoinmasters: true,
      autoSatisfyWithStash: false,
      maximizerFoldables: true,
      autoTuxedo: true,
      autoPinkyRing: true,
      autoGarish: true,
      valueOfInventory: 2,
      suppressMallPriceCacheMessages: true,
    });
    runDiet();
    propertyManager.resetAll();
    return;
  }

  const gardens = $items`packet of pumpkin seeds, Peppermint Pip Packet, packet of dragon's teeth, packet of beer seeds, packet of winter seeds, packet of thanksgarden seeds, packet of tall grass seeds, packet of mushroom spores`;
  const startingGarden = gardens.find((garden) =>
    Object.getOwnPropertyNames(getCampground()).includes(garden.name)
  );
  if (
    startingGarden &&
    !$items`packet of tall grass seeds, packet of mushroom spores`.includes(startingGarden) &&
    getCampground()[startingGarden.name] &&
    $items`packet of tall grass seeds, packet of mushroom spores`.some((gardenSeed) =>
      have(gardenSeed)
    )
  ) {
    visitUrl("campground.php?action=garden&pwd");
  }

  const aaBossFlag =
    xpath(
      visitUrl("account.php?tab=combat"),
      `//*[@id="opt_flag_aabosses"]/label/input[@type='checkbox']@checked`
    )[0] === "checked"
      ? 1
      : 0;

  try {
    print("Collecting garbage!", HIGHLIGHT);
    if (globalOptions.stopTurncount !== null) {
      print(`Stopping in ${globalOptions.stopTurncount - myTurncount()}`, HIGHLIGHT);
    }
    print();

    if (
      have($item`packet of tall grass seeds`) &&
      myGardenType() !== "grass" &&
      myGardenType() !== "mushroom"
    ) {
      use($item`packet of tall grass seeds`);
    }

    setAutoAttack(0);
    visitUrl(`account.php?actions[]=flag_aabosses&flag_aabosses=1&action=Update`, true);

    propertyManager.set({
      logPreferenceChange: true,
      logPreferenceChangeFilter: [
        ...new Set([
          ...get("logPreferenceChangeFilter").split(","),
          "libram_savedMacro",
          "maximizerMRUList",
          "testudinalTeachings",
          "garboEmbezzlerDate",
          "garboEmbezzlerCount",
          "garboEmbezzlerSources",
          "spadingData",
        ]),
      ]
        .sort()
        .filter((a) => a)
        .join(","),
      battleAction: "custom combat script",
      autoSatisfyWithMall: true,
      autoSatisfyWithNPCs: true,
      autoSatisfyWithCoinmasters: true,
      autoSatisfyWithStash: false,
      dontStopForCounters: true,
      maximizerFoldables: true,
      hpAutoRecovery: -0.05,
      hpAutoRecoveryTarget: 0.0,
      mpAutoRecovery: -0.05,
      mpAutoRecoveryTarget: 0.0,
      afterAdventureScript: "",
      betweenBattleScript: "",
      choiceAdventureScript: "",
      familiarScript: "",
      customCombatScript: "garbo",
      currentMood: "apathetic",
      autoTuxedo: true,
      autoPinkyRing: true,
      autoGarish: true,
      allowNonMoodBurning: !globalOptions.ascending,
      allowSummonBurning: true,
      libramSkillsSoftcore: "none", // Don't cast librams when mana burning, handled manually based on sale price
      valueOfInventory: 2,
      suppressMallPriceCacheMessages: true,
    });
    let bestHalloweiner = 0;
    if (haveInCampground($item`haunted doghouse`)) {
      const halloweinerOptions: { price: number; choiceId: number }[] = (
        [
          [$items`bowl of eyeballs, bowl of mummy guts, bowl of maggots`, 1],
          [$items`blood and blood, Jack-O-Lantern beer, zombie`, 2],
          [$items`wind-up spider, plastic nightmare troll, Telltale™ rubber heart`, 3],
        ] as [Item[], number][]
      ).map(([halloweinerOption, choiceId]) => {
        return { price: garboAverageValue(...halloweinerOption), choiceId: choiceId };
      });
      bestHalloweiner = halloweinerOptions.sort((a, b) => b.price - a.price)[0].choiceId;
    }
    propertyManager.setChoices({
      1106: 3, // Ghost Dog Chow
      1107: 1, // tennis ball
      1108: bestHalloweiner,
      1341: 1, // Cure her poison
    });

    if (JuneCleaver.have()) {
      propertyManager.setChoices(
        Object.fromEntries(
          JuneCleaver.choices.map((choice) => [choice, bestJuneCleaverOption(choice)])
        )
      );
    }

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

    // unlock the sea
    if (myLevel() >= 11 && questStep("questS01OldGuy") === -1) {
      visitUrl("place.php?whichplace=sea_oldman&action=oldman_oldman");
    }
    if (
      myClass() === $class`Seal Clubber` &&
      !have($skill`Furious Wallop`) &&
      guildStoreAvailable()
    ) {
      visitUrl("guild.php?action=buyskill&skillid=32", true);
    }
    const stashItems = $items`repaid diaper, Buddy Bjorn, Crown of Thrones, origami pasties, Pantsgiving, mafia pointer finger ring`;
    if (
      myInebriety() <= inebrietyLimit() &&
      (myClass() !== $class`Seal Clubber` || !have($skill`Furious Wallop`))
    ) {
      stashItems.push(...$items`haiku katana, Operation Patriot Shield`);
    }
    // FIXME: Dynamically figure out pointer ring approach.
    withStash(stashItems, () => {
      withVIPClan(() => {
        // 0. diet stuff.
        if (globalOptions.noDiet || get("_garboYachtzeeChainCompleted", false)) {
          print("We should not be yachtzee chaining", "red");
          globalOptions.yachtzeeChain = false;
        }

        if (
          !globalOptions.noDiet &&
          (!globalOptions.yachtzeeChain || get("_garboYachtzeeChainCompleted", false))
        ) {
          runDiet();
        }

        // 1. make an outfit (amulet coin, pantogram, etc), misc other stuff (VYKEA, songboom, robortender drinks)
        dailySetup();

        setDefaultMaximizeOptions({
          preventEquip: $items`broken champagne bottle, Spooky Putty snake, Spooky Putty mitre, Spooky Putty leotard, Spooky Putty ball, papier-mitre, papier-mâchéte, papier-mâchine gun, papier-masque, papier-mâchuridars, smoke ball, stinky fannypack`,
          preventSlot: $slots`buddy-bjorn, crown-of-thrones`,
        });

        // 2. do some embezzler stuff
        freeFights();
        postFreeFightDailySetup(); // setup stuff that can interfere with free fights (VYKEA)
        yachtzeeChain();
        dailyFights();

        if (!globalOptions.noBarf) {
          // 3. burn turns at barf
          potionSetup(false);
          maximize("MP", false);
          meatMood().execute(estimatedTurns());
          try {
            while (canContinue()) {
              barfTurn();
              postCombatActions();
            }

            // buy one-day tickets with FunFunds if user desires
            if (
              get("garbo_buyPass", false) &&
              availableAmount($item`FunFunds™`) >= 20 &&
              !have($item`one-day ticket to Dinseylandfill`)
            ) {
              print("Buying a one-day ticket", HIGHLIGHT);
              buy(
                $coinmaster`The Dinsey Company Store`,
                1,
                $item`one-day ticket to Dinseylandfill`
              );
            }
          } finally {
            setAutoAttack(0);
          }
        } else setAutoAttack(0);
      });
    });
  } finally {
    propertyManager.resetAll();
    set("garboStashItems", stashItems.map((item) => toInt(item).toFixed(0)).join(","));
    visitUrl(`account.php?actions[]=flag_aabosses&flag_aabosses=${aaBossFlag}&action=Update`, true);
    if (startingGarden && have(startingGarden)) use(startingGarden);
    printEmbezzlerLog();
    printGarboSession();
    printLog(HIGHLIGHT);
  }
}
