import {
  booleanModifier,
  canAdventure,
  chatPrivate,
  cliExecute,
  fullnessLimit,
  getClanLounge,
  haveEquipped,
  inebrietyLimit,
  itemAmount,
  Location,
  mallPrice,
  myAdventures,
  myFamiliar,
  myFullness,
  myHash,
  myInebriety,
  myTurncount,
  print,
  retrieveItem,
  runChoice,
  runCombat,
  toInt,
  toUrl,
  use,
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
  $monsters,
  $skill,
  adventureMacro,
  adventureMacroAuto,
  ChateauMantegna,
  CombatLoversLocket,
  Counter,
  CrystalBall,
  get,
  have,
  property,
  questStep,
  Requirement,
  set,
  SourceTerminal,
  sum,
} from "libram";
import { acquire } from "./acquire";
import { Macro, shouldRedigitize, withMacro } from "./combat";
import { usingThumbRing } from "./dropsgear";
import { crateStrategy, doingExtrovermectin, equipOrbIfDesired } from "./extrovermectin";
import {
  averageEmbezzlerNet,
  globalOptions,
  HIGHLIGHT,
  ltbRun,
  setChoice,
  userConfirmDialog,
  WISH_VALUE,
} from "./lib";
import { waterBreathingEquipment } from "./outfit";
import { determineDraggableZoneAndEnsureAccess, DraggableFight } from "./wanderer";

const embezzler = $monster`Knob Goblin Embezzler`;

/**
 * Configure the behavior of the fights in use in different parts of the fight engine
 * @interface EmbezzlerFightConfigOptions
 * @member {Requirement[]?} requirements maximizer requirements to use for this fight (defaults to empty)
 * @member {draggableFight?} draggable if this fight can be pulled into another zone and what kind of draggable it is (defaults to undefined)
 * @member {boolean?} canInitializeWandererCounters if this fight can be used to initialize wanderers (defaults to false)
 * @member {boolean?} gregariousReplace if this is a "monster replacement" fight - pulls another monster from the CSV (defautls to false)
 * @member {boolean?} wrongEncounterName if mafia does not update the lastEncounter properly when doing this fight (defaults to value of gregariousReplace)
 */
interface EmbezzlerFightConfigOptions {
  requirements?: Requirement[];
  draggable?: DraggableFight;
  canInitializeWandererCounters?: boolean;
  wrongEncounterName?: boolean;
  gregariousReplace?: boolean;
}

class EmbezzlerFightRunOptions {
  #macro: Macro;
  #location?: Location;
  #useAuto: boolean;

  constructor(macro: Macro, location?: Location, useAuto = true) {
    this.#macro = macro;
    this.#location = location;
    this.#useAuto = useAuto;
  }

  get macro(): Macro {
    return this.#macro;
  }

  get location(): Location {
    if (!this.#location) {
      throw "Embezzler fight tried to access a location, but none was set";
    } else {
      return this.#location;
    }
  }

  get useAuto(): boolean {
    return this.#useAuto;
  }
}

export class EmbezzlerFight {
  name: string;
  available: () => boolean;
  potential: () => number;
  execute: (options: EmbezzlerFightRunOptions) => void;
  requirements: Requirement[];
  draggable?: DraggableFight;
  canInitializeWandererCounters: boolean;
  wrongEncounterName: boolean;
  gregariousReplace: boolean;

  /**
   * This is the class that creates all the different ways to fight embezzlers
   * @classdesc Embezzler Fight enc
   * @prop {string} name The name of the source of this fight, primarily used to identify special cases.
   * @prop {() => boolean} available Returns whether or not we can do this fight right now (this may change later in the day).
   * @prop {() => number} potential Returns the number of embezzlers we expect to be able to fight from this source given the current state of hte character
   *  This is used when computing turns for buffs, so it should be as accurate as possible to the number of KGE we will fight
   * @prop {(options: EmbezzlerFightRunOptions) => void} execute This runs the combat, optionally using the provided location and macro. Location is used only by draggable fights.
   *  This is the meat of each fight. How do you initialize the fight? Are there any special considerations?
   * @prop {EmbezzlerFightConfigOptions} options configuration options for this fight. see EmbezzlerFightConfigOptions for full details of all available options
   * @example
   * // suppose that we wanted to add a fight that will use print screens repeatedly, as long as we have them in our inventory
   * new EmbezzlerFight(
   *  "Print Screen Monster",
   *  () => have($item`screencapped monster`) && get('screencappedMonster') === embezzler, // in order to start this fight, a KGE must already be screen capped
   *  () => availableAmount($item`screencapped monster`) + availableAmount($item`print screen button`) // the total of potential of this fight is the number of already copied KGE + the number of potentially copiable KGE
   *  () => (options: EmbezzlerFightRunOptions) => {
   *    const macro = Macro
   *      .externalIf(have($item`print screen button`), Macro.tryItem($item`print screen button`))
   *      .step(options.macro); // you should always include the macro passed in via options, as it may have special considerations for this fight
   *    withMacro(macro, () => useItem($item`screen capped monster`));
   *  },
   *  {
   *    canInitializeWnadererCounts: false; // this copy cannot be used to start wanderer counters, since the combats are not adv.php
   *  }
   * )
   */
  constructor(
    name: string,
    available: () => boolean,
    potential: () => number,
    execute: (options: EmbezzlerFightRunOptions) => void,
    options: EmbezzlerFightConfigOptions = {}
  ) {
    this.name = name;
    this.available = available;
    this.potential = potential;
    this.execute = execute;
    this.requirements = options.requirements ?? [];
    this.draggable = options.draggable;
    this.canInitializeWandererCounters = options.canInitializeWandererCounters ?? false;
    this.gregariousReplace = options.gregariousReplace ?? false;
    this.wrongEncounterName = options.wrongEncounterName ?? this.gregariousReplace;
  }

  run(options: { macro?: Macro; location?: Location; useAuto?: boolean } = {}): void {
    if (!this.available() || !myAdventures()) return;
    print(`Now running Embezzler fight: ${this.name}. Stay tuned for details.`);
    const fightMacro = options.macro ?? embezzlerMacro();
    if (this.draggable) {
      this.execute(
        new EmbezzlerFightRunOptions(fightMacro, this.location(options.location), options.useAuto)
      );
    } else {
      this.execute(new EmbezzlerFightRunOptions(fightMacro, undefined, options.useAuto));
    }
  }

  location(location?: Location): Location {
    const taffyIsWorthIt = () =>
      mallPrice($item`pulled green taffy`) < 3 * get("valueOfAdventure") &&
      retrieveItem($item`pulled green taffy`);

    const suggestion =
      this.draggable && !location && checkUnderwater() && taffyIsWorthIt()
        ? $location`The Briny Deeps`
        : location;

    if (
      (this.draggable && !suggestion) ||
      (this.draggable === "backup" && suggestion && suggestion.combatPercent < 100)
    ) {
      return determineDraggableZoneAndEnsureAccess(this.draggable);
    }
    return suggestion ?? $location`Noob Cave`;
  }
}

function checkUnderwater() {
  // first check to see if underwater even makes sense
  if (
    questStep("questS01OldGuy") >= 0 &&
    !(get("_envyfishEggUsed") || have($item`envyfish egg`)) &&
    (get("_garbo_weightChain", false) || !have($familiar`Pocket Professor`)) &&
    (booleanModifier("Adventure Underwater") ||
      waterBreathingEquipment.some((item) => have(item))) &&
    (have($effect`Fishy`) || (have($item`fishy pipe`) && !get("_fishyPipeUsed")))
  ) {
    if (!have($effect`Fishy`) && !get("_fishyPipeUsed")) use($item`fishy pipe`);

    return have($effect`Fishy`);
  }

  return false;
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
    throw new Error("Failed to acquire photocopied Knob Goblin Embezzler.");
  }
}

export const embezzlerMacro = (): Macro =>
  Macro.if_(
    embezzler,
    Macro.if_($location`The Briny Deeps`, Macro.tryCopier($item`pulled green taffy`))
      .externalIf(
        myFamiliar() === $familiar`Reanimated Reanimator`,
        Macro.trySkill($skill`Wink at`)
      )
      .externalIf(
        myFamiliar() === $familiar`Obtuse Angel`,
        Macro.trySkill($skill`Fire a badly romantic arrow`)
      )
      .externalIf(
        get("beGregariousCharges") > 0 &&
          (get("beGregariousMonster") !== embezzler || get("beGregariousFightsLeft") === 0),
        Macro.trySkill($skill`Be Gregarious`)
      )
      .externalIf(
        SourceTerminal.getDigitizeMonster() !== embezzler || shouldRedigitize(),
        Macro.tryCopier($skill`Digitize`)
      )
      .tryCopier($item`Spooky Putty sheet`)
      .tryCopier($item`Rain-Doh black box`)
      .tryCopier($item`4-d camera`)
      .tryCopier($item`unfinished ice sculpture`)
      .externalIf(get("_enamorangs") === 0, Macro.tryCopier($item`LOV Enamorang`))
      .meatKill()
  )
    .if_($monsters`giant rubber spider, time-spinner prank`, Macro.kill())
    .abort();

const wandererFailsafeMacro = () =>
  Macro.externalIf(
    haveEquipped($item`backup camera`) &&
      get("_backUpUses") < 11 &&
      get("lastCopyableMonster") === embezzler,
    Macro.if_(`!monsterid ${embezzler.id}`, Macro.skill($skill`Back-Up to your Last Enemy`))
  );

export const chainStarters = [
  new EmbezzlerFight(
    "Chateau Painting",
    () =>
      ChateauMantegna.have() &&
      !ChateauMantegna.paintingFought() &&
      ChateauMantegna.paintingMonster() === embezzler,
    () =>
      ChateauMantegna.have() &&
      !ChateauMantegna.paintingFought() &&
      ChateauMantegna.paintingMonster() === embezzler
        ? 1
        : 0,
    (options: EmbezzlerFightRunOptions) => {
      withMacro(options.macro, () => ChateauMantegna.fightPainting(), options.useAuto);
    }
  ),
  new EmbezzlerFight(
    "Combat Lover's Locket",
    () => CombatLoversLocket.availableLocketMonsters().includes(embezzler),
    () => (CombatLoversLocket.availableLocketMonsters().includes(embezzler) ? 1 : 0),
    (options: EmbezzlerFightRunOptions) => {
      withMacro(options.macro, () => CombatLoversLocket.reminisce(embezzler), options.useAuto);
    }
  ),
  new EmbezzlerFight(
    "Fax",
    () =>
      have($item`Clan VIP Lounge key`) &&
      !get("_photocopyUsed") &&
      getClanLounge()["deluxe fax machine"] !== undefined,
    () =>
      have($item`Clan VIP Lounge key`) &&
      !get("_photocopyUsed") &&
      getClanLounge()["deluxe fax machine"] !== undefined
        ? 1
        : 0,
    (options: EmbezzlerFightRunOptions) => {
      faxEmbezzler();
      withMacro(options.macro, () => use($item`photocopied monster`), options.useAuto);
    }
  ),
  new EmbezzlerFight(
    "Pillkeeper Semirare",
    () =>
      have($item`Eight Days a Week Pill Keeper`) &&
      canAdventure($location`Cobb's Knob Treasury`) &&
      !get("_freePillKeeperUsed") &&
      !have($effect`Lucky!`),
    () =>
      have($item`Eight Days a Week Pill Keeper`) &&
      canAdventure($location`Cobb's Knob Treasury`) &&
      !get("_freePillKeeperUsed") &&
      !have($effect`Lucky!`)
        ? 1
        : 0,
    (options: EmbezzlerFightRunOptions) => {
      retrieveItem($item`Eight Days a Week Pill Keeper`);
      cliExecute("pillkeeper semirare");
      if (!have($effect`Lucky!`)) {
        set("_freePillKeeperUsed", true);
        return;
      }
      const adventureFunction = options.useAuto ? adventureMacroAuto : adventureMacro;
      adventureFunction($location`Cobb's Knob Treasury`, options.macro, options.macro);
    }
  ),
];

export const copySources = [
  new EmbezzlerFight(
    "Time-Spinner",
    () =>
      have($item`Time-Spinner`) &&
      $locations`Noob Cave, The Dire Warren, The Haunted Kitchen`.some((location) =>
        location.combatQueue.includes(embezzler.name)
      ) &&
      get("_timeSpinnerMinutesUsed") <= 7,
    () =>
      have($item`Time-Spinner`) &&
      $locations`Noob Cave, The Dire Warren, The Haunted Kitchen`.some(
        (location) =>
          location.combatQueue.includes(embezzler.name) || get("beGregariousCharges") > 0
      )
        ? Math.floor((10 - get("_timeSpinnerMinutesUsed")) / 3)
        : 0,
    (options: EmbezzlerFightRunOptions) => {
      withMacro(
        options.macro,
        () => {
          visitUrl(`inv_use.php?whichitem=${toInt($item`Time-Spinner`)}`);
          runChoice(1);
          visitUrl(`choice.php?whichchoice=1196&monid=${embezzler.id}&option=1`);
          runCombat();
        },
        options.useAuto
      );
    }
  ),
  new EmbezzlerFight(
    "Spooky Putty & Rain-Doh",
    () =>
      (have($item`Spooky Putty monster`) && get("spookyPuttyMonster") === embezzler) ||
      (have($item`Rain-Doh box full of monster`) && get("rainDohMonster") === embezzler),
    () => {
      const havePutty = have($item`Spooky Putty sheet`) || have($item`Spooky Putty monster`);
      const haveRainDoh =
        have($item`Rain-Doh black box`) || have($item`Rain-Doh box full of monster`);
      const puttyLocked =
        have($item`Spooky Putty monster`) && get("spookyPuttyMonster") !== embezzler;
      const rainDohLocked =
        have($item`Rain-Doh box full of monster`) && get("rainDohMonster") !== embezzler;

      if (havePutty && haveRainDoh) {
        if (puttyLocked && rainDohLocked) return 0;
        else if (puttyLocked) {
          return 5 - get("_raindohCopiesMade") + itemAmount($item`Rain-Doh box full of monster`);
        } else if (rainDohLocked) {
          return 5 - get("spookyPuttyCopiesMade") + itemAmount($item`Spooky Putty monster`);
        }
        return (
          6 -
          get("spookyPuttyCopiesMade") -
          get("_raindohCopiesMade") +
          itemAmount($item`Spooky Putty monster`) +
          itemAmount($item`Rain-Doh box full of monster`)
        );
      } else if (havePutty) {
        if (puttyLocked) return 0;
        return 5 - get("spookyPuttyCopiesMade") + itemAmount($item`Spooky Putty monster`);
      } else if (haveRainDoh) {
        if (rainDohLocked) return 0;
        return 5 - get("_raindohCopiesMade") + itemAmount($item`Rain-Doh box full of monster`);
      }
      return 0;
    },
    (options: EmbezzlerFightRunOptions) => {
      const macro = options.macro;
      withMacro(
        macro,
        () => {
          if (have($item`Spooky Putty monster`)) return use($item`Spooky Putty monster`);
          return use($item`Rain-Doh box full of monster`);
        },
        options.useAuto
      );
    }
  ),
  new EmbezzlerFight(
    "4-d Camera",
    () =>
      have($item`shaking 4-d camera`) && get("cameraMonster") === embezzler && !get("_cameraUsed"),
    () =>
      have($item`shaking 4-d camera`) && get("cameraMonster") === embezzler && !get("_cameraUsed")
        ? 1
        : 0,
    (options: EmbezzlerFightRunOptions) => {
      withMacro(options.macro, () => use($item`shaking 4-d camera`), options.useAuto);
    }
  ),
  new EmbezzlerFight(
    "Ice Sculpture",
    () =>
      have($item`ice sculpture`) &&
      get("iceSculptureMonster") === embezzler &&
      !get("_iceSculptureUsed"),
    () =>
      have($item`ice sculpture`) &&
      get("iceSculptureMonster") === embezzler &&
      !get("_iceSculptureUsed")
        ? 1
        : 0,
    (options: EmbezzlerFightRunOptions) => {
      withMacro(options.macro, () => use($item`ice sculpture`), options.useAuto);
    }
  ),
  new EmbezzlerFight(
    "Green Taffy",
    () =>
      have($item`envyfish egg`) && get("envyfishMonster") === embezzler && !get("_envyfishEggUsed"),
    () =>
      have($item`envyfish egg`) && get("envyfishMonster") === embezzler && !get("_envyfishEggUsed")
        ? 1
        : 0,
    (options: EmbezzlerFightRunOptions) => {
      withMacro(options.macro, () => use($item`envyfish egg`)), options.useAuto;
    }
  ),
  new EmbezzlerFight(
    "Screencapped Monster",
    () =>
      have($item`screencapped monster`) &&
      property.getString("screencappedMonster") === "Knob Goblin Embezzler",
    () =>
      property.getString("screencappedMonster") === "Knob Goblin Embezzler"
        ? itemAmount($item`screencapped monster`)
        : 0,
    (options: EmbezzlerFightRunOptions) => {
      withMacro(options.macro, () => use($item`screencapped monster`), options.useAuto);
    }
  ),
  new EmbezzlerFight(
    "Sticky Clay Homunculus",
    () =>
      have($item`sticky clay homunculus`) &&
      property.getString("crudeMonster") === "Knob Goblin Embezzler",
    () =>
      property.getString("crudeMonster") === "Knob Goblin Embezzler"
        ? itemAmount($item`sticky clay homunculus`)
        : 0,
    (options: EmbezzlerFightRunOptions) =>
      withMacro(options.macro, () => use($item`sticky clay homunculus`), options.useAuto)
  ),
];

export const wanderSources = [
  new EmbezzlerFight(
    "Lucky!",
    () => canAdventure($location`Cobb's Knob Treasury`) && have($effect`Lucky!`),
    () => (canAdventure($location`Cobb's Knob Treasury`) && have($effect`Lucky!`) ? 1 : 0),
    (options: EmbezzlerFightRunOptions) => {
      const adventureFunction = options.useAuto ? adventureMacroAuto : adventureMacro;
      adventureFunction($location`Cobb's Knob Treasury`, options.macro, options.macro);
    }
  ),
  new EmbezzlerFight(
    "Digitize",
    () =>
      get("_sourceTerminalDigitizeMonster") === embezzler && Counter.get("Digitize Monster") <= 0,
    () => (SourceTerminal.have() && SourceTerminal.getDigitizeUses() === 0 ? 1 : 0),
    (options: EmbezzlerFightRunOptions) => {
      const adventureFunction = options.useAuto ? adventureMacroAuto : adventureMacro;
      adventureFunction(
        options.location,
        wandererFailsafeMacro().step(options.macro),
        wandererFailsafeMacro().step(options.macro)
      );
    },
    {
      draggable: "wanderer",
    }
  ),
  new EmbezzlerFight(
    "Guaranteed Romantic Monster",
    () =>
      get("_romanticFightsLeft") > 0 &&
      Counter.get("Romantic Monster window begin") <= 0 &&
      Counter.get("Romantic Monster window end") <= 0,
    () => 0,
    (options: EmbezzlerFightRunOptions) => {
      const adventureFunction = options.useAuto ? adventureMacroAuto : adventureMacro;
      adventureFunction(
        options.location,
        wandererFailsafeMacro().step(options.macro),
        wandererFailsafeMacro().step(options.macro)
      );
    },
    {
      draggable: "wanderer",
    }
  ),
  new EmbezzlerFight(
    "Enamorang",
    () => Counter.get("Enamorang") <= 0 && get("enamorangMonster") === embezzler,
    () =>
      (Counter.get("Enamorang") <= 0 && get("enamorangMonster") === embezzler) ||
      (have($item`LOV Enamorang`) && !get("_enamorangs"))
        ? 1
        : 0,
    (options: EmbezzlerFightRunOptions) => {
      const adventureFunction = options.useAuto ? adventureMacroAuto : adventureMacro;
      adventureFunction(
        options.location,
        wandererFailsafeMacro().step(options.macro),
        wandererFailsafeMacro().step(options.macro)
      );
    },
    {
      draggable: "wanderer",
    }
  ),
];

export const conditionalSources = [
  new EmbezzlerFight(
    "Orb Prediction",
    () =>
      have($item`miniature crystal ball`) &&
      !get("_garbo_doneGregging", false) &&
      CrystalBall.ponder().get($location`The Dire Warren`) === embezzler,
    () =>
      (have($item`miniature crystal ball`) ? 1 : 0) *
      (get("beGregariousCharges") +
        (get("beGregariousFightsLeft") > 0 ||
        CrystalBall.ponder().get($location`The Dire Warren`) === embezzler
          ? 1
          : 0)),
    (options: EmbezzlerFightRunOptions) => {
      visitUrl("inventory.php?ponder=1");
      if (
        CrystalBall.ponder().get($location`The Dire Warren`) !== $monster`Knob Goblin Embezzler`
      ) {
        return;
      }
      const adventureFunction = options.useAuto ? adventureMacroAuto : adventureMacro;
      adventureFunction($location`The Dire Warren`, options.macro, options.macro);
      toasterGaze();
      if (!doingExtrovermectin()) set("_garbo_doneGregging", true);
    },
    {
      requirements: [new Requirement([], { forceEquip: $items`miniature crystal ball` })],
      canInitializeWandererCounters: true,
    }
  ),
  new EmbezzlerFight(
    "Macrometeorite",
    () =>
      get("beGregariousMonster") === embezzler &&
      get("beGregariousFightsLeft") > 0 &&
      have($skill`Meteor Lore`) &&
      get("_macrometeoriteUses") < 10 &&
      proceedWithOrb(),
    () =>
      ((get("beGregariousMonster") === embezzler && get("beGregariousFightsLeft") > 0) ||
        get("beGregariousCharges") > 0) &&
      have($skill`Meteor Lore`)
        ? 10 - get("_macrometeoriteUses")
        : 0,
    (options: EmbezzlerFightRunOptions) => {
      equipOrbIfDesired();

      const crateIsSabered = get("_saberForceMonster") === $monster`crate`;
      const notEnoughCratesSabered = get("_saberForceMonsterCount") < 2;
      const weWantToSaberCrates = !crateIsSabered || notEnoughCratesSabered;
      setChoice(1387, 2);

      const macro = Macro.if_(
        $monster`crate`,
        Macro.externalIf(
          crateStrategy() !== "Saber" && !have($effect`On the Trail`) && get("_olfactionsUsed") < 2,
          Macro.tryHaveSkill($skill`Transcendent Olfaction`)
        )
          .externalIf(
            haveEquipped($item`Fourth of May Cosplay Saber`) &&
              weWantToSaberCrates &&
              get("_saberForceUses") < 5,
            Macro.trySkill($skill`Use the Force`)
          )
          .skill($skill`Macrometeorite`)
      ).step(options.macro);
      const adventureFunction = options.useAuto ? adventureMacroAuto : adventureMacro;
      adventureFunction($location`Noob Cave`, macro, macro);
      if (CrystalBall.ponder().get($location`Noob Cave`) === embezzler) toasterGaze();
    },
    {
      gregariousReplace: true,
    }
  ),
  new EmbezzlerFight(
    "Powerful Glove",
    () =>
      get("beGregariousMonster") === embezzler &&
      get("beGregariousFightsLeft") > 0 &&
      have($item`Powerful Glove`) &&
      get("_powerfulGloveBatteryPowerUsed") <= 90 &&
      proceedWithOrb(),
    () =>
      ((get("beGregariousMonster") === embezzler && get("beGregariousFightsLeft") > 0) ||
        get("beGregariousCharges") > 0) &&
      have($item`Powerful Glove`)
        ? Math.min((100 - get("_powerfulGloveBatteryPowerUsed")) / 10)
        : 0,
    (options: EmbezzlerFightRunOptions) => {
      equipOrbIfDesired();

      const crateIsSabered = get("_saberForceMonster") === $monster`crate`;
      const notEnoughCratesSabered = get("_saberForceMonsterCount") < 2;
      const weWantToSaberCrates = !crateIsSabered || notEnoughCratesSabered;
      setChoice(1387, 2);

      const macro = Macro.if_(
        $monster`crate`,
        Macro.externalIf(
          crateStrategy() !== "Saber" && !have($effect`On the Trail`) && get("_olfactionsUsed") < 2,
          Macro.tryHaveSkill($skill`Transcendent Olfaction`)
        )
          .externalIf(
            haveEquipped($item`Fourth of May Cosplay Saber`) &&
              weWantToSaberCrates &&
              get("_saberForceUses") < 5,
            Macro.trySkill($skill`Use the Force`)
          )
          .skill($skill`CHEAT CODE: Replace Enemy`)
      ).step(options.macro);
      const adventureFunction = options.useAuto ? adventureMacroAuto : adventureMacro;
      adventureFunction($location`Noob Cave`, macro, macro);
      if (CrystalBall.ponder().get($location`Noob Cave`) === embezzler) toasterGaze();
    },
    {
      requirements: [new Requirement([], { forceEquip: $items`Powerful Glove` })],
      gregariousReplace: true,
    }
  ),
  new EmbezzlerFight(
    "Be Gregarious",
    () =>
      get("beGregariousMonster") === embezzler &&
      get("beGregariousFightsLeft") > (have($item`miniature crystal ball`) ? 1 : 0),
    () =>
      get("beGregariousMonster") === embezzler
        ? get("beGregariousCharges") * 3 + get("beGregariousFightsLeft")
        : 0,
    (options: EmbezzlerFightRunOptions) => {
      const run = ltbRun();
      run.constraints.preparation?.();
      const adventureFunction = options.useAuto ? adventureMacroAuto : adventureMacro;
      adventureFunction(
        $location`The Dire Warren`,
        Macro.if_($monster`fluffy bunny`, run.macro).step(options.macro),
        Macro.if_($monster`fluffy bunny`, run.macro).step(options.macro)
      );
      // reset the crystal ball prediction by staring longingly at toast
      if (get("beGregariousFightsLeft") === 1 && have($item`miniature crystal ball`)) {
        const warrenPrediction = CrystalBall.ponder().get($location`The Dire Warren`);
        if (warrenPrediction !== embezzler) toasterGaze();
      }
    },
    {
      canInitializeWandererCounters: true,
    }
  ),
  new EmbezzlerFight(
    "Be Gregarious (Set Up Crystal Ball)",
    () =>
      get("beGregariousMonster") === embezzler &&
      get("beGregariousFightsLeft") === 1 &&
      have($item`miniature crystal ball`) &&
      !CrystalBall.ponder().get($location`The Dire Warren`),
    () =>
      (get("beGregariousMonster") === embezzler && get("beGregariousFightsLeft") > 0) ||
      get("beGregariousCharges") > 0
        ? 1
        : 0,
    (options: EmbezzlerFightRunOptions) => {
      adventureMacro($location`The Dire Warren`, Macro.if_(embezzler, options.macro).abort());
    },
    {
      requirements: [
        new Requirement([], {
          forceEquip: $items`miniature crystal ball`.filter((item) => have(item)),
        }),
      ],
      canInitializeWandererCounters: true,
    }
  ),
  new EmbezzlerFight(
    "Backup",
    () =>
      get("lastCopyableMonster") === embezzler &&
      have($item`backup camera`) &&
      get("_backUpUses") < 11,
    () => (have($item`backup camera`) ? 11 - get("_backUpUses") : 0),
    (options: EmbezzlerFightRunOptions) => {
      const adventureFunction = options.useAuto ? adventureMacroAuto : adventureMacro;
      adventureFunction(
        options.location,
        Macro.if_(
          `!monsterid ${embezzler.id}`,
          Macro.skill($skill`Back-Up to your Last Enemy`)
        ).step(options.macro),
        Macro.if_(
          `!monsterid ${embezzler.id}`,
          Macro.skill($skill`Back-Up to your Last Enemy`)
        ).step(options.macro)
      );
    },
    {
      requirements: [
        new Requirement([], {
          forceEquip: $items`backup camera`,
          bonusEquip: new Map([[$item`backup camera`, 5000]]),
        }),
      ],
      draggable: "backup",
      wrongEncounterName: true,
      canInitializeWandererCounters: true,
    }
  ),
];

export const fakeSources = [
  new EmbezzlerFight(
    "Professor MeatChain",
    () => false,
    () =>
      have($familiar`Pocket Professor`) && !get("_garbo_meatChain", false)
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
      have($familiar`Pocket Professor`) && !get("_garbo_weightChain", false)
        ? Math.min(15 - get("_pocketProfessorLectures"), 5)
        : 0,
    () => {
      return;
    }
  ),
];

export const emergencyChainStarters = [
  // These are very deliberately the last embezzler fights.
  new EmbezzlerFight(
    "11-leaf clover (untapped potential)",
    () => {
      const potential = Math.floor(embezzlerCount());
      if (potential < 1) return false;
      if (!canAdventure($location`Cobb's Knob Treasury`)) {
        return false;
      }
      // Don't use clovers if wishes are available and cheaper
      if (get("_genieFightsUsed") < 3 && mallPrice($item`11-leaf clover`) >= WISH_VALUE) {
        return false;
      }
      if (globalOptions.askedAboutWish) return globalOptions.wishAnswer;
      const profit = (potential + 1) * averageEmbezzlerNet() - mallPrice($item`11-leaf clover`);
      if (profit < 0) return false;
      print(`You have the following embezzler-sources untapped right now:`, HIGHLIGHT);
      embezzlerSources
        .filter((source) => source.potential() > 0)
        .map((source) => `${source.potential()} from ${source.name}`)
        .forEach((text) => print(text, HIGHLIGHT));
      globalOptions.askedAboutWish = true;
      globalOptions.wishAnswer = userConfirmDialog(
        `Garbo has detected you have ${potential} potential ways to copy an Embezzler, but no way to start a fight with one. Current embezzler net (before potions) is ${averageEmbezzlerNet()}, so we expect to earn ${profit} meat, after the cost of a 11-leaf clover. Should we get Lucky! for an Embezzler?`,
        true
      );
      return globalOptions.wishAnswer;
    },
    () => 0,
    (options: EmbezzlerFightRunOptions) => {
      property.withProperty("autoSatisfyWithCloset", true, () =>
        retrieveItem($item`11-leaf clover`)
      );
      use($item`11-leaf clover`);
      if (have($effect`Lucky!`)) {
        const adventureFunction = options.useAuto ? adventureMacroAuto : adventureMacro;
        adventureFunction($location`Cobb's Knob Treasury`, options.macro, options.macro);
      }
      globalOptions.askedAboutWish = false;
    }
  ),
  new EmbezzlerFight(
    "Pocket Wish (untapped potential)",
    () => {
      const potential = Math.floor(embezzlerCount());
      if (potential < 1) return false;
      if (get("_genieFightsUsed") >= 3) return false;
      if (globalOptions.askedAboutWish) return globalOptions.wishAnswer;
      const profit = (potential + 1) * averageEmbezzlerNet() - WISH_VALUE;
      if (profit < 0) return false;
      print(`You have the following embezzler-sources untapped right now:`, HIGHLIGHT);
      embezzlerSources
        .filter((source) => source.potential() > 0)
        .map((source) => `${source.potential()} from ${source.name}`)
        .forEach((text) => print(text, HIGHLIGHT));
      globalOptions.askedAboutWish = true;
      globalOptions.wishAnswer = userConfirmDialog(
        `Garbo has detected you have ${potential} potential ways to copy an Embezzler, but no way to start a fight with one. Current embezzler net (before potions) is ${averageEmbezzlerNet()}, so we expect to earn ${profit} meat, after the cost of a wish. Should we wish for an Embezzler?`,
        true
      );
      return globalOptions.wishAnswer;
    },
    () => 0,
    (options: EmbezzlerFightRunOptions) => {
      withMacro(
        options.macro,
        () => {
          acquire(1, $item`pocket wish`, WISH_VALUE);
          visitUrl(`inv_use.php?pwd=${myHash()}&which=3&whichitem=9537`, false, true);
          visitUrl(
            "choice.php?pwd&whichchoice=1267&option=1&wish=to fight a Knob Goblin Embezzler ",
            true,
            true
          );
          visitUrl("main.php", false);
          runCombat();
          globalOptions.askedAboutWish = false;
        },
        options.useAuto
      );
    }
  ),
];

export const embezzlerSources = [
  ...wanderSources,
  ...conditionalSources,
  ...copySources,
  ...chainStarters,
  ...emergencyChainStarters,
  ...fakeSources,
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
  const nightcapAdventures =
    globalOptions.ascending &&
    myInebriety() <= inebrietyLimit() &&
    have($item`Drunkula's wineglass`)
      ? 60
      : 0;
  const thumbRingMultiplier = usingThumbRing() ? 1 / 0.96 : 1;

  // We need to estimate adventures from our organs if we are only dieting after yachtzee chaining
  const distentionPillSpace = have($item`distention pill`) && !get("_distentionPillUsed") ? 1 : 0;
  const syntheticPillSpace =
    have($item`synthetic dog hair pill`) && !get("_syntheticDogHairPillUsed") ? 1 : 0;
  const shotglassSpace = have($item`mime army shotglass`) && !get("_mimeArmyShotglassUsed") ? 1 : 0;
  const sweatSpace = have($item`designer sweatpants`) ? 3 - get("_sweatOutSomeBoozeUsed") : 0;
  const fullnessAdventures = (fullnessLimit() - myFullness() + distentionPillSpace) * 8;
  const inebrietyAdventures =
    (inebrietyLimit() - myInebriety() + syntheticPillSpace + sweatSpace + shotglassSpace) * 7;
  const borrowedTimeAdventures = globalOptions.ascending && !get("_borrowedTimeUsed") ? 20 : 0;
  const chocolateAdventures = ((3 - get("_chocolatesUsed")) * (4 - get("_chocolatesUsed"))) / 2;
  const yachtzeeTurns = 30; // guesstimate
  const bufferAdventures = 30; // We don't know if garbo would decide to use melange/voraci tea/sweet tooth to get more adventures
  const adventuresAfterChaining =
    globalOptions.yachtzeeChain && !get("_garboYachtzeeChainCompleted")
      ? Math.max(
          fullnessAdventures +
            inebrietyAdventures +
            borrowedTimeAdventures +
            chocolateAdventures +
            bufferAdventures -
            yachtzeeTurns,
          0
        )
      : 0;

  let turns;
  if (globalOptions.stopTurncount) turns = globalOptions.stopTurncount - myTurncount();
  else if (globalOptions.noBarf) turns = embezzlerCount();
  else if (globalOptions.saveTurns > 0 || !globalOptions.ascending) {
    turns =
      (myAdventures() +
        sausageAdventures +
        pantsgivingAdventures +
        thesisAdventures +
        adventuresAfterChaining -
        globalOptions.saveTurns) *
      thumbRingMultiplier;
  } else {
    turns =
      (myAdventures() +
        sausageAdventures +
        pantsgivingAdventures +
        nightcapAdventures +
        thesisAdventures +
        adventuresAfterChaining) *
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
  const wanderer = wanderSources.find((fight) => fight.available());
  if (wanderer) return wanderer;
  const conditional = conditionalSources.find((fight) => fight.available());
  if (conditional) {
    const leftoverReplacers =
      (have($skill`Meteor Lore`) ? 10 - get("_macrometeoriteUses") : 0) +
      (have($item`Powerful Glove`)
        ? Math.floor(100 - get("_powerfulGloveBatteryPowerUsed") / 10)
        : 0);
    // we don't want to reset our orb with a gregarious fight; that defeats the purpose
    const skip =
      conditional.name === "Be Gregarious" && crateStrategy() === "Orb" && leftoverReplacers;
    if (!skip) return conditional;
  }
  const copy = copySources.find((fight) => fight.available());
  if (copy) return copy;
  const chainStart = chainStarters.find((fight) => fight.available());
  if (chainStart) return chainStart;
  return conditional ?? emergencyChainStarters.find((fight) => fight.available()) ?? null;
}

/**
 * Determines whether we want to do this particular Embezzler fight; if we aren't using orb, should always return true. If we're using orb and it's a crate, we'll have to see!
 * @returns
 */
function proceedWithOrb(): boolean {
  const strat = crateStrategy();
  // If we can't possibly use orb, return true
  if (!have($item`miniature crystal ball`) || strat !== "Orb") return true;

  // If we're using orb, we have a KGE prediction, and we can reset it, return false
  const gregFightNames = ["Macrometeorite", "Powerful Glove", "Be Gregarious", "Orb Prediction"];
  if (
    CrystalBall.ponder().get($location`Noob Cave`) === embezzler &&
    embezzlerSources
      .filter((source) => !gregFightNames.includes(source.name))
      .find((source) => source.available())
  ) {
    return false;
  }

  return true;
}

function toasterGaze(): void {
  try {
    const store = visitUrl(toUrl($location`The Shore, Inc. Travel Agency`));
    if (!store.includes("Check out the gift shop")) {
      print("Unable to stare longingly at toast");
    }
    runChoice(4);
  } catch {
    // orb reseting raises a mafia error
  }
  visitUrl("main.php");
}
