import { canAdv } from "canadv.ash";
import {
  abort,
  chatPrivate,
  cliExecute,
  getCounter,
  getCounters,
  haveEquipped,
  inebrietyLimit,
  itemAmount,
  meatDropModifier,
  myAdventures,
  myHash,
  myInebriety,
  myTurncount,
  print,
  retrieveItem,
  runChoice,
  runCombat,
  toInt,
  toMonster,
  toUrl,
  use,
  userConfirm,
  visitUrl,
  wait,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $items,
  $location,
  $locations,
  $monster,
  $skill,
  adventureMacro,
  ChateauMantegna,
  CrystalBall,
  get,
  have,
  property,
  Requirement,
  SourceTerminal,
  sum,
} from "libram";
import { acquire } from "./acquire";
import { Macro, shouldRedigitize, withMacro } from "./combat";
import { usingThumbRing } from "./dropsgear";
import { crateStrategy, equipOrbIfDesired } from "./extrovermectin";
import { baseMeat, globalOptions, ltbRun, WISH_VALUE } from "./lib";
import { determineDraggableZoneAndEnsureAccess, draggableFight } from "./wanderer";

type EmbezzlerFightOptions = {
  location?: Location;
  macro?: Macro;
};

export class EmbezzlerFight {
  available: () => boolean;
  potential: () => number;
  run: (options: EmbezzlerFightOptions) => void;
  requirements: Requirement[];
  draggable: boolean;
  name: string;
  /**
   * This is the class that creates all the different ways to fight embezzlers
   * @classdesc Something goes here
   * @prop {string} name The name of the source of this fight, primarily used to identify special cases.
   * @prop {() => boolean} available Returns whether or not we can do this fight right now.
   * @prop {() => number} potential Returns the number of embezzlers we expect to be able to fight from this source.
   * @prop {(options: EmbezzlerFightOptions) => void} run This runs the combat, optionally using the provided location and macro. Location is used only by draggable fights.
   * @prop {Requirement[]} requirements This is an array of requirements to do this fight
   * @prop {boolean} [draggable=false] This tells the script if it is able the embezzler to a different zone
   *
   */
  constructor(
    name: string,
    available: () => boolean,
    potential: () => number,
    run: (options: EmbezzlerFightOptions) => void,
    requirements: Requirement[] = [],
    draggable = false
  ) {
    this.name = name;
    this.available = available;
    this.potential = potential;
    this.run = run;
    this.requirements = requirements;
    this.draggable = draggable;
  }
}

function checkFax(): boolean {
  if (!have($item`photocopied monster`)) cliExecute("fax receive");
  if (property.getString("photocopyMonster") === "Knob Goblin Embezzler") return true;
  cliExecute("fax send");
  return false;
}

function faxEmbezzler(): void {
  if (!get("_photocopyUsed")) {
    if (checkFax()) return;
    chatPrivate("cheesefax", "Knob Goblin Embezzler");
    for (let i = 0; i < 3; i++) {
      wait(10);
      if (checkFax()) return;
    }
    abort("Failed to acquire photocopied Knob Goblin Embezzler.");
  }
}

export const embezzlerMacro = (): Macro =>
  Macro.if_(
    $monster`Knob Goblin Embezzler`,
    Macro.if_($location`The Briny Deeps`, Macro.tryCopier($item`pulled green taffy`))
      .trySkill($skill`Wink at`)
      .trySkill($skill`Fire a badly romantic arrow`)
      .externalIf(
        get("beGregariousCharges") > 0 &&
          (get("beGregariousMonster") !== $monster`Knob Goblin Embezzler` ||
            get("beGregariousFightsLeft") === 0),
        Macro.trySkill($skill`Be Gregarious`)
      )
      .externalIf(
        get("_sourceTerminalDigitizeMonster") !== $monster`Knob Goblin Embezzler` ||
          shouldRedigitize(),
        Macro.tryCopier($skill`Digitize`)
      )
      .tryCopier($item`Spooky Putty sheet`)
      .tryCopier($item`Rain-Doh black box`)
      .tryCopier($item`4-d camera`)
      .tryCopier($item`unfinished ice sculpture`)
      .externalIf(get("_enamorangs") === 0, Macro.tryCopier($item`LOV Enamorang`))
      .meatKill()
  ).abort();

export const embezzlerSources = [
  new EmbezzlerFight(
    "Digitize",
    () =>
      get("_sourceTerminalDigitizeMonster") === $monster`Knob Goblin Embezzler` &&
      getCounters("Digitize Monster", 0, 0).trim() !== "",
    () => (SourceTerminal.have() && get("_sourceTerminalDigitizeUses") === 0 ? 1 : 0),
    (options: EmbezzlerFightOptions) => {
      adventureMacro(
        options.location ?? determineDraggableZoneAndEnsureAccess(draggableFight.WANDERER),
        Macro.externalIf(
          haveEquipped($item`backup camera`) &&
            get("_backUpUses") < 11 &&
            get("lastCopyableMonster") === $monster`Knob Goblin Embezzler`,
          Macro.if_(
            `!monsterid ${$monster`Knob Goblin Embezzler`.id}`,
            Macro.skill($skill`Back-Up to your Last Enemy`)
          )
        ).step(options.macro ?? embezzlerMacro())
      );
    },
    [],
    true
  ),
  new EmbezzlerFight(
    "Guaranteed Romantic Monster",
    () =>
      get("_romanticFightsLeft") > 0 &&
      getCounter("Romantic Monster window begin") <= 0 &&
      getCounter("Romantic Monster window end") <= 0 &&
      (getCounter("Romantic Monster window end") !== -1 ||
        getCounters("Romantic Monster window end", -1, -1).trim() !== ""),
    () => 0,
    (options: EmbezzlerFightOptions) => {
      const location =
        options.location ?? determineDraggableZoneAndEnsureAccess(draggableFight.WANDERER);
      const macro = Macro.externalIf(
        haveEquipped($item`backup camera`) &&
          get("_backUpUses") < 11 &&
          get("lastCopyableMonster") === $monster`Knob Goblin Embezzler`,
        Macro.if_(
          `!monsterid ${$monster`Knob Goblin Embezzler`.id}`,
          Macro.skill($skill`Back-Up to your Last Enemy`)
        )
      ).step(options.macro ?? embezzlerMacro());
      adventureMacro(location, macro);
    },
    undefined,
    true
  ),
  new EmbezzlerFight(
    "Enamorang",
    () =>
      getCounters("Enamorang", 0, 0).trim() !== "" &&
      get("enamorangMonster") === $monster`Knob Goblin Embezzler`,
    () =>
      (getCounters("Enamorang", 0, 0).trim() !== "" &&
        get("enamorangMonster") === $monster`Knob Goblin Embezzler`) ||
      (have($item`LOV Enamorang`) && !get("_enamorangs"))
        ? 1
        : 0,
    (options: EmbezzlerFightOptions) => {
      adventureMacro(
        options.location ?? determineDraggableZoneAndEnsureAccess(draggableFight.WANDERER),
        Macro.externalIf(
          haveEquipped($item`backup camera`) &&
            get("_backUpUses") < 11 &&
            get("lastCopyableMonster") === $monster`Knob Goblin Embezzler`,
          Macro.if_(
            `!monsterid ${$monster`Knob Goblin Embezzler`.id}`,
            Macro.skill($skill`Back-Up to your Last Enemy`)
          )
        ).step(embezzlerMacro())
      );
    },
    [],
    true
  ),
  new EmbezzlerFight(
    "Orb Prediction",
    () =>
      CrystalBall.currentPredictions(false).get($location`The Dire Warren`) ===
      $monster`Knob Goblin Embezzler`,
    () =>
      (have($item`miniature crystal ball`) ? 1 : 0) *
      get("beGregariousCharges") *
      +(get("beGregariousFightsLeft") > 0 ||
      CrystalBall.currentPredictions(false).get($location`The Dire Warren`) ===
        $monster`Knob Goblin Embezzler`
        ? 1
        : 0),
    (options: EmbezzlerFightOptions) => {
      const macro = options.macro ?? embezzlerMacro();
      adventureMacro($location`The Dire Warren`, macro);
    },
    [new Requirement([], { forceEquip: $items`miniature crystal ball` })]
  ),
  new EmbezzlerFight(
    "Time-Spinner",
    () =>
      have($item`Time-Spinner`) &&
      $locations`Noob Cave, The Dire Warren`.some((location) =>
        location.combatQueue.includes($monster`Knob Goblin Embezzler`.name)
      ) &&
      get("_timeSpinnerMinutesUsed") <= 7,
    () =>
      have($item`Time-Spinner`) &&
      $locations`Noob Cave, The Dire Warren`.some(
        (location) =>
          location.combatQueue.includes($monster`Knob Goblin Embezzler`.name) ||
          get("beGregariousCharges") > 0
      )
        ? Math.floor((10 - get("_timeSpinnerMinutesUsed")) / 3)
        : 0,
    (options: EmbezzlerFightOptions) => {
      const macro = options.macro ?? embezzlerMacro();
      withMacro(macro, () => {
        visitUrl(`inv_use.php?whichitem=${toInt($item`Time-Spinner`)}`);
        runChoice(1);
        visitUrl(
          `choice.php?whichchoice=1196&monid=${$monster`Knob Goblin Embezzler`.id}&option=1`
        );
        runCombat();
      });
    }
  ),
  new EmbezzlerFight(
    "Macrometeorite",
    () =>
      get("beGregariousMonster") === $monster`Knob Goblin Embezzler` &&
      get("beGregariousFightsLeft") > 0 &&
      have($skill`Meteor Lore`) &&
      get("_macrometeoriteUses") < 10 &&
      proceedWithOrb(),
    () =>
      ((get("beGregariousMonster") === $monster`Knob Goblin Embezzler` &&
        get("beGregariousFightsLeft") > 0) ||
        get("beGregariousCharges") > 0) &&
      have($skill`Meteor Lore`)
        ? 10 - get("_macrometeoriteUses")
        : 0,
    (options: EmbezzlerFightOptions) => {
      equipOrbIfDesired();
      const baseMacro = options.macro ?? embezzlerMacro();
      const macro = Macro.if_(
        $monster`crate`,
        Macro.externalIf(
          crateStrategy() !== "Saber" && !have($effect`On the Trail`),
          Macro.trySkill($skill`Transcendent Olfaction`)
        ).skill($skill`Macrometeorite`)
      ).step(baseMacro);
      adventureMacro($location`Noob Cave`, macro);
    }
    // do we want to equip orb on these guys?
  ),
  new EmbezzlerFight(
    "Powerful Glove",
    () =>
      get("beGregariousMonster") === $monster`Knob Goblin Embezzler` &&
      get("beGregariousFightsLeft") > 0 &&
      have($item`Powerful Glove`) &&
      get("_powerfulGloveBatteryPowerUsed") < 90 &&
      proceedWithOrb(),
    () =>
      ((get("beGregariousMonster") === $monster`Knob Goblin Embezzler` &&
        get("beGregariousFightsLeft") > 0) ||
        get("beGregariousCharges") > 0) &&
      have($item`Powerful Glove`)
        ? Math.min((100 - get("_powerfulGloveBatteryPowerUsed")) / 10)
        : 0,
    (options: EmbezzlerFightOptions) => {
      equipOrbIfDesired();
      const baseMacro = options.macro ?? embezzlerMacro();
      const macro = Macro.if_(
        $monster`crate`,
        Macro.externalIf(
          crateStrategy() !== "Saber" && !have($effect`On the Trail`),
          Macro.trySkill($skill`Transcendent Olfaction`)
        ).skill($skill`CHEAT CODE: Replace Enemy`)
      ).step(baseMacro);
      adventureMacro($location`Noob Cave`, macro);
    },
    [new Requirement([], { forceEquip: $items`Powerful Glove` })]
  ),
  new EmbezzlerFight(
    "Be Gregarious",
    () =>
      get("beGregariousMonster") === $monster`Knob Goblin Embezzler` &&
      get("beGregariousFightsLeft") > 1,
    () =>
      get("beGregariousMonster") === $monster`Knob Goblin Embezzler`
        ? get("beGregariousCharges") * 3 + get("beGregariousFightsLeft")
        : 0,
    (options: EmbezzlerFightOptions) => {
      const run = ltbRun();
      if (run.prepare) run.prepare();
      adventureMacro(
        $location`The Dire Warren`,
        Macro.if_($monster`fluffy bunny`, run.macro).step(options.macro ?? embezzlerMacro())
      );
      // reset the crystal ball prediction by staring longingly at toast
      if (
        get("beGregariousFightsLeft") === 1 &&
        CrystalBall.currentPredictions(false).get($location`The Dire Warren`) !==
          $monster`Knob Goblin Embezzler`
      ) {
        try {
          const store = visitUrl(toUrl($location`The Shore, Inc. Travel Agency`));
          if (!store.includes("Check Out the Gift Shop")) {
            print("Unable to stare longingly at toast");
          }
          runChoice(4);
        } catch {
          // orb reseting raises a mafia error
        }
        visitUrl("main.php");
      }
    }
  ),
  new EmbezzlerFight(
    "Final Be Gregarious",
    () =>
      retrieveItem(1, $item`human musk`) &&
      get("beGregariousMonster") === $monster`Knob Goblin Embezzler` &&
      get("beGregariousFightsLeft") === 1,
    () =>
      (get("beGregariousMonster") === $monster`Knob Goblin Embezzler` &&
        get("beGregariousFightsLeft") > 0) ||
      get("beGregariousCharges") > 0
        ? 1
        : 0,
    (options: EmbezzlerFightOptions) => {
      adventureMacro(
        $location`The Dire Warren`,
        Macro.if_($monster`fluffy bunny`, Macro.item($item`human musk`)).step(
          options.macro ?? embezzlerMacro()
        )
      );
    },
    [
      new Requirement([], {
        forceEquip: $items`miniature crystal ball`.filter((item) => have(item)),
      }),
    ]
  ),
  new EmbezzlerFight(
    "Backup",
    () =>
      get("lastCopyableMonster") === $monster`Knob Goblin Embezzler` &&
      have($item`backup camera`) &&
      get("_backUpUses") < 11,
    () => (have($item`backup camera`) ? 11 - get("_backUpUses") : 0),
    (options: EmbezzlerFightOptions) => {
      const realLocation =
        options.location && options.location.combatPercent >= 100
          ? options.location
          : determineDraggableZoneAndEnsureAccess(draggableFight.BACKUP);
      adventureMacro(
        realLocation,
        Macro.if_(
          `!monsterid ${$monster`Knob Goblin Embezzler`.id}`,
          Macro.skill($skill`Back-Up to your Last Enemy`)
        ).step(options.macro || embezzlerMacro())
      );
    },
    [
      new Requirement([], {
        forceEquip: $items`backup camera`,
        bonusEquip: new Map([[$item`backup camera`, 5000]]),
      }),
    ],
    true
  ),
  new EmbezzlerFight(
    "Spooky Putty & Rain-Doh",
    () =>
      (have($item`Spooky Putty monster`) &&
        get("spookyPuttyMonster") === $monster`Knob Goblin Embezzler`) ||
      (have($item`Rain-Doh box full of monster`) &&
        get("rainDohMonster") === $monster`Knob Goblin Embezzler`),
    () => {
      if (
        (have($item`Spooky Putty sheet`) || have($item`Spooky Putty monster`)) &&
        (have($item`Rain-Doh black box`) || have($item`Rain-Doh box full of monster`))
      ) {
        return (
          6 -
          get("spookyPuttyCopiesMade") -
          get("_raindohCopiesMade") +
          itemAmount($item`Spooky Putty monster`) +
          itemAmount($item`Rain-Doh box full of monster`)
        );
      } else if (have($item`Spooky Putty sheet`) || have($item`Spooky Putty monster`)) {
        return 5 - get("spookyPuttyCopiesMade") + itemAmount($item`Spooky Putty monster`);
      } else if (have($item`Rain-Doh black box`) || have($item`Rain-Doh box full of monster`)) {
        return 5 - get("_raindohCopiesMade") + itemAmount($item`Rain-Doh box full of monster`);
      }
      return 0;
    },
    (options: EmbezzlerFightOptions) => {
      const macro = options.macro ?? embezzlerMacro();
      withMacro(macro, () => {
        if (have($item`Spooky Putty monster`)) return use($item`Spooky Putty monster`);
        return use($item`Rain-Doh box full of monster`);
      });
    }
  ),
  new EmbezzlerFight(
    "4-d Camera",
    () =>
      have($item`shaking 4-d camera`) &&
      get("cameraMonster") === $monster`Knob Goblin Embezzler` &&
      !get("_cameraUsed"),
    () =>
      have($item`shaking 4-d camera`) &&
      get("cameraMonster") === $monster`Knob Goblin Embezzler` &&
      !get("_cameraUsed")
        ? 1
        : 0,
    (options: EmbezzlerFightOptions) => {
      const macro = options.macro ?? embezzlerMacro();
      withMacro(macro, () => use($item`shaking 4-d camera`));
    }
  ),
  new EmbezzlerFight(
    "Ice Sculpture",
    () =>
      have($item`ice sculpture`) &&
      get("iceSculptureMonster") === $monster`Knob Goblin Embezzler` &&
      !get("_iceSculptureUsed"),
    () =>
      have($item`ice sculpture`) &&
      get("iceSculptureMonster") === $monster`Knob Goblin Embezzler` &&
      !get("_iceSculptureUsed")
        ? 1
        : 0,
    (options: EmbezzlerFightOptions) => {
      const macro = options.macro ?? embezzlerMacro();
      withMacro(macro, () => use($item`ice sculpture`));
    }
  ),
  new EmbezzlerFight(
    "Green Taffy",
    () =>
      have($item`envyfish egg`) &&
      get("envyfishMonster") === $monster`Knob Goblin Embezzler` &&
      !get("_envyfishEggUsed"),
    () =>
      have($item`envyfish egg`) &&
      get("envyfishMonster") === $monster`Knob Goblin Embezzler` &&
      !get("_envyfishEggUsed")
        ? 1
        : 0,
    (options: EmbezzlerFightOptions) => {
      const macro = options.macro ?? embezzlerMacro();
      withMacro(macro, () => use($item`envyfish egg`));
    }
  ),
  new EmbezzlerFight(
    "Chateau Painting",
    () =>
      ChateauMantegna.have() &&
      !ChateauMantegna.paintingFought() &&
      ChateauMantegna.paintingMonster() === $monster`Knob Goblin Embezzler`,
    () =>
      ChateauMantegna.have() &&
      !ChateauMantegna.paintingFought() &&
      ChateauMantegna.paintingMonster() === $monster`Knob Goblin Embezzler`
        ? 1
        : 0,
    (options: EmbezzlerFightOptions) => {
      const macro = options.macro ?? embezzlerMacro();
      withMacro(macro, () => ChateauMantegna.fightPainting());
    }
  ),
  new EmbezzlerFight(
    "Fax",
    () => have($item`Clan VIP Lounge key`) && !get("_photocopyUsed"),
    () => (have($item`Clan VIP Lounge key`) && !get("_photocopyUsed") ? 1 : 0),
    (options: EmbezzlerFightOptions) => {
      const macro = options.macro ?? embezzlerMacro();
      faxEmbezzler();
      withMacro(macro, () => use($item`photocopied monster`));
    }
  ),
  new EmbezzlerFight(
    "Pillkeeper Semirare",
    () =>
      have($item`Eight Days a Week Pill Keeper`) &&
      canAdv($location`Cobb's Knob Treasury`, true) &&
      !get("_freePillKeeperUsed"),
    () =>
      have($item`Eight Days a Week Pill Keeper`) &&
      canAdv($location`Cobb's Knob Treasury`, true) &&
      !get("_freePillKeeperUsed")
        ? 1
        : 0,
    () => {
      retrieveItem($item`Eight Days a Week Pill Keeper`);
      cliExecute("pillkeeper semirare");
      adventureMacro($location`Cobb's Knob Treasury`, embezzlerMacro());
    }
  ),
  // These are very deliberately the last embezzler fights.
  new EmbezzlerFight(
    "Pocket Wish",
    () => {
      const potential = Math.floor(embezzlerCount());
      if (potential < 1) return false;
      if (get("_genieFightsUsed") >= 3) return false;
      if (globalOptions.askedAboutWish) return globalOptions.wishAnswer;
      const averageEmbezzlerNet = ((baseMeat + 750) * meatDropModifier()) / 100;
      print(`You have the following embezzler-sources untapped right now:`, "blue");
      const profit = (potential + 1) * averageEmbezzlerNet - WISH_VALUE;
      if (profit < 0) return false;
      embezzlerSources
        .filter((source) => source.potential() > 0)
        .map((source) => `${source.potential()} from ${source.name}`)
        .forEach((text) => print(text, "blue"));
      globalOptions.askedAboutWish = true;
      globalOptions.wishAnswer = userConfirm(
        `Garbo has detected you have ${potential} potential ways to copy an Embezzler, but no way to start a fight with one. Current embezzler net (before potions) is ${averageEmbezzlerNet}, so we expect to earn ${profit} meat, after the cost of a wish. Should we wish for an Embezzler?`
      );
      return globalOptions.wishAnswer;
    },
    () => 0,
    (options: EmbezzlerFightOptions) => {
      const macro = options.macro ?? embezzlerMacro();
      withMacro(macro, () => {
        acquire(1, $item`pocket wish`, WISH_VALUE);
        visitUrl(`inv_use.php?pwd=${myHash()}&which=3&whichitem=9537`, false, true);
        visitUrl(
          "choice.php?pwd&whichchoice=1267&option=1&wish=to fight a Knob Goblin Embezzler ",
          true,
          true
        );
        visitUrl("main.php", false);
        runCombat();
      });
      globalOptions.askedAboutWish = false;
    }
  ),
  new EmbezzlerFight(
    "Professor MeatChain",
    () => false,
    () =>
      have($familiar`Pocket Professor`) && !get<boolean>("_garbo_meatChain", false)
        ? Math.max(10 - get("_pocketProfessorLectures"), 0)
        : 0,
    () => {
      return;
    }
  ),
  new EmbezzlerFight(
    "Professor WeightChain",
    () => false,
    () =>
      have($familiar`Pocket Professor`) && !get<boolean>("_garbo_weightChain", false)
        ? Math.min(15 - get("_pocketProfessorLectures"), 5)
        : 0,
    () => {
      return;
    }
  ),
];

export function embezzlerCount(): number {
  return sum(embezzlerSources, (source: EmbezzlerFight) => source.potential());
}

export function estimatedTurns(): number {
  // Assume roughly 2 fullness from pantsgiving and 8 adventures/fullness.
  const pantsgivingAdventures = have($item`Pantsgiving`)
    ? Math.max(0, 2 - get("_pantsgivingFullness")) * 8
    : 0;
  const potentialSausages =
    itemAmount($item`magical sausage`) + itemAmount($item`magical sausage casing`);
  const sausageAdventures = have($item`Kramco Sausage-o-Matic™`)
    ? Math.min(potentialSausages, 23 - get("_sausagesEaten"))
    : 0;
  const thesisAdventures = have($familiar`Pocket Professor`) && !get("_thesisDelivered") ? 11 : 0;
  const nightcapAdventures = globalOptions.ascending && myInebriety() <= inebrietyLimit() ? 60 : 0;
  const thumbRingMultiplier = usingThumbRing() ? 1 / 0.96 : 1;

  let turns;
  if (globalOptions.stopTurncount) turns = globalOptions.stopTurncount - myTurncount();
  else if (globalOptions.noBarf) turns = embezzlerCount();
  else {
    turns =
      (myAdventures() +
        sausageAdventures +
        pantsgivingAdventures +
        nightcapAdventures +
        thesisAdventures) *
      thumbRingMultiplier;
  }

  return turns;
}

/**
 * Gets next available embezzler fight. If there is no way to generate a fight, but copies are available,
 * the user is prompted to purchase a pocket wish to start the embezzler chain.
 * @returns the next available embezzler fight
 */
export function getNextEmbezzlerFight(): EmbezzlerFight | null {
  for (const fight of embezzlerSources) {
    if (fight.available()) return fight;
  }
  return null;
}

/**
 * Determines whether we want to do this particular Embezzler fight; if we aren't using orb, should always return true. If we're using orb and it's a crate, we'll have to see!
 * @returns
 */
function proceedWithOrb(): boolean {
  const strat = crateStrategy();
  // If we can't possibly use orb, return true
  if (!have($item`miniature crystal ball`) || strat === "Saber") return true;

  // If we're sniffing and an Embezzler is in the queue already, return true
  if (
    strat === "Sniff" &&
    $location`Noob Cave`.combatQueue
      .split(";")
      .map((monster) => toMonster(monster))
      .includes($monster`Knob Goblin Embezzler`)
  ) {
    return true;
  }

  // If we're using orb, we have a KGE prediction, and we can reset it, return false
  const gregFightNames = ["Macrometeorite", "Powerful Glove", "Be Gregarious", "Orb Prediction"];
  if (
    CrystalBall.currentPredictions(false).get($location`Noob Cave`) ===
      $monster`Knob Goblin Embezzler` &&
    embezzlerSources
      .filter((source) => !gregFightNames.includes(source.name))
      .find((source) => source.available())
  ) {
    return false;
  }

  return true;
}
