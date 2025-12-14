import { Outfit, OutfitSpec } from "grimoire-kolmafia";
import {
  adv1,
  availableAmount,
  buy,
  canAdventure,
  canEquip,
  cliExecute,
  closetAmount,
  create,
  Effect,
  equip,
  equippedItem,
  familiarEquippedEquipment,
  getAutoAttack,
  haveOutfit,
  inebrietyLimit,
  isBanished,
  Item,
  itemAmount,
  Location,
  mallPrice,
  maximize,
  Monster,
  myAdventures,
  myAscensions,
  myBuffedstat,
  myClass,
  myFamiliar,
  myInebriety,
  myLevel,
  myThrall,
  myTurncount,
  numericModifier,
  outfit,
  print,
  putCloset,
  refreshStash,
  retrieveItem,
  retrievePrice,
  runChoice,
  runCombat,
  setAutoAttack,
  setLocation,
  Skill,
  stashAmount,
  takeCloset,
  toInt,
  toItem,
  totalTurnsPlayed,
  use,
  useFamiliar,
  useSkill,
  visitUrl,
} from "kolmafia";
import {
  $class,
  $effect,
  $effects,
  $familiar,
  $item,
  $items,
  $location,
  $locations,
  $monster,
  $monsters,
  $phylum,
  $skill,
  $slot,
  $stat,
  $thrall,
  ActionSource,
  BatWings,
  Cartography,
  ChestMimic,
  CinchoDeMayo,
  clamp,
  ClosedCircuitPayphone,
  CombatLoversLocket,
  Counter,
  CrystalBall,
  Delayed,
  ensureEffect,
  FindActionSourceConstraints,
  get,
  GingerBread,
  have,
  Latte,
  maxBy,
  PocketProfessor,
  property,
  Robortender,
  set,
  Snapper,
  SourceTerminal,
  sum,
  undelay,
  withChoice,
} from "libram";
import { MonsterProperty } from "libram/dist/propertyTypes";
import { WanderDetails } from "garbo-lib";

import { acquire } from "./acquire";
import { withStash } from "./clan";
import { garboAdventure, garboAdventureAuto, Macro, withMacro } from "./combat";
import { globalOptions } from "./config";
import { postFreeFightDailySetup } from "./dailiespost";
import { copyTargetSources, getNextCopyTargetFight } from "./target";
import {
  bestMidnightAvailable,
  crateStrategy,
  doingGregFight,
  gregReady,
  initializeExtrovermectinZones,
  saberCrateIfSafe,
  shouldClara,
  shouldUnlockIngredients,
  tryFillLatte,
  willYachtzee,
} from "./resources";
import {
  freeFightFamiliar,
  meatFamiliar,
  setBestLeprechaunAsMeatFamiliar,
} from "./familiar";
import {
  aprilFoolsRufus,
  asArray,
  bestShadowRift,
  burnLibrams,
  ESTIMATED_OVERDRUNK_TURNS,
  eventLog,
  expectedTargetProfit,
  freeRest,
  freeRunConstraints,
  getUsingFreeBunnyBanish,
  HIGHLIGHT,
  isFree,
  isFreeAndCopyable,
  isStrongScaler,
  kramcoGuaranteed,
  lastAdventureWasWeird,
  logMessage,
  ltbRun,
  mapMonster,
  maxPassiveDamage,
  monsterManuelAvailable,
  propertyManager,
  questStep,
  RequireAtLeastOne,
  romanticMonsterImpossible,
  safeRestore,
  setChoice,
  targetingMeat,
  targetMeat,
  tryFindFreeRunOrBanish,
  userConfirmDialog,
  valueDrops,
} from "./lib";
import { freeFightMood, meatMood } from "./mood";
import {
  freeFightOutfit,
  FreeFightOutfitMenuOptions,
  magnifyingGlass,
  meatTargetOutfit,
  toSpec,
} from "./outfit";
import postCombatActions from "./post";
import { bathroomFinance, potionSetup } from "./potions";
import { garboValue } from "./garboValue";
import { wanderer } from "./garboWanderer";
import { runTargetFight } from "./target/execution";
import { TargetFightRunOptions } from "./target/staging";
import {
  EmbezzlerFightsQuest,
  FreeFightQuest,
  FreeMimicEggDonationQuest,
  runGarboQuests,
} from "./tasks";
import {
  expectedFreeFightQuestFights,
  possibleFreeFightQuestTentacleFights,
} from "./tasks/freeFight";
import { PostQuest } from "./tasks/post";
import {
  expectedFreeGiantSandwormQuestFights,
  FreeGiantSandwormQuest,
  possibleFreeGiantSandwormQuestTentacleFights,
} from "./tasks/freeGiantSandworm";
import { CopyTargetFight } from "./target/fights";
import {
  BuffExtensionQuest,
  PostBuffExtensionQuest,
} from "./tasks/buffExtension";
import { highMeatMonsterCount } from "./turns";

const firstChainMacro = () =>
  Macro.if_(
    globalOptions.target,
    Macro.externalIf(isStrongScaler(globalOptions.target), Macro.delevel())
      .if_("hppercentbelow 30", Macro.tryItem($item`New Age healing crystal`))
      .if_(
        `!${Macro.makeBALLSPredicate($skill`lecture on relativity`)}`,
        Macro.externalIf(
          SourceTerminal.getDigitizeMonster() !== globalOptions.target,
          Macro.tryCopier($skill`Digitize`),
        )
          .tryCopier($item`Spooky Putty sheet`)
          .tryCopier($item`Rain-Doh black box`)
          .tryCopier($item`4-d camera`)
          .tryCopier($item`unfinished ice sculpture`)
          .externalIf(
            get("_enamorangs") === 0,
            Macro.tryCopier($item`LOV Enamorang`),
          ),
      )
      .trySkill($skill`lecture on relativity`)
      .meatKill(false),
  ).abort();

const secondChainMacro = () =>
  Macro.if_(
    globalOptions.target,
    Macro.externalIf(isStrongScaler(globalOptions.target), Macro.delevel())
      .if_("hppercentbelow 30", Macro.tryItem($item`New Age healing crystal`))
      .if_(
        `!${Macro.makeBALLSPredicate($skill`lecture on relativity`)}`,
        Macro.trySkill($skill`Meteor Shower`),
      )
      .if_(
        `!${Macro.makeBALLSPredicate($skill`lecture on relativity`)}`,
        Macro.externalIf(
          get("_sourceTerminalDigitizeMonster") !== globalOptions.target,
          Macro.tryCopier($skill`Digitize`),
        )
          .tryCopier($item`Spooky Putty sheet`)
          .tryCopier($item`Rain-Doh black box`)
          .tryCopier($item`4-d camera`)
          .tryCopier($item`unfinished ice sculpture`)
          .externalIf(
            get("_enamorangs") === 0,
            Macro.tryCopier($item`LOV Enamorang`),
          ),
      )
      .trySkill($skill`lecture on relativity`)
      .meatKill(false),
  ).abort();

function meatTargetSetup() {
  setLocation($location`Friar Ceremony Location`);
  potionSetup(false);
  maximize("MP", false);
  meatMood(true, targetMeat()).execute(highMeatMonsterCount());
  safeRestore();
  freeFightMood().execute(50);
  runGarboQuests([BuffExtensionQuest, PostBuffExtensionQuest]);
  burnLibrams(400);

  bathroomFinance(highMeatMonsterCount());

  if (SourceTerminal.have()) {
    SourceTerminal.educate([$skill`Extract`, $skill`Digitize`]);
  }
  if (
    !get("_cameraUsed") &&
    !have($item`shaking 4-d camera`) &&
    expectedTargetProfit() > mallPrice($item`4-d camera`)
  ) {
    property.withProperty("autoSatisfyWithCloset", true, () =>
      retrieveItem($item`4-d camera`),
    );
  }

  if (
    !get("_iceSculptureUsed") &&
    !have($item`ice sculpture`) &&
    expectedTargetProfit() >
      (mallPrice($item`snow berries`) + mallPrice($item`ice harvest`)) * 3
  ) {
    property.withProperty("autoSatisfyWithCloset", true, () => {
      cliExecute("refresh inventory");
      retrieveItem($item`unfinished ice sculpture`);
    });
  }

  if (
    !get("_enamorangs") &&
    !itemAmount($item`LOV Enamorang`) &&
    expectedTargetProfit() > 20000
  ) {
    retrieveItem($item`LOV Enamorang`);
  }

  if (doingGregFight()) {
    initializeExtrovermectinZones();
  }
}

function startWandererCounter() {
  const nextFight = getNextCopyTargetFight();
  if (
    !nextFight ||
    nextFight.canInitializeWandererCounters ||
    nextFight.draggable
  ) {
    return;
  }
  const digitizeNeedsStarting =
    Counter.get("Digitize Monster") === Infinity &&
    SourceTerminal.getDigitizeUses() !== 0;
  const romanceNeedsStarting =
    get("_romanticFightsLeft") > 0 &&
    Counter.get("Romantic Monster window begin") === Infinity &&
    Counter.get("Romantic Monster window end") === Infinity;
  if (digitizeNeedsStarting || romanceNeedsStarting) {
    if (digitizeNeedsStarting) {
      print("Starting digitize counter by visiting the Haunted Kitchen!");
    }
    if (romanceNeedsStarting) {
      print("Starting romance counter by visiting the Haunted Kitchen!");
    }
    do {
      let run: ActionSource;
      if (gregReady()) {
        print(
          "You still have gregs active, so we're going to wear your meat outfit.",
        );
        run = ltbRun();
        run.constraints.preparation?.();
        meatTargetOutfit().dress();
      } else {
        print("You do not have gregs active, so this is a regular free run.");
        run = tryFindFreeRunOrBanish(freeRunConstraints()) ?? ltbRun();
        run.constraints.preparation?.();
        freeFightOutfit(toSpec(run), $location`The Haunted Kitchen`).dress();
      }
      garboAdventure(
        $location`The Haunted Kitchen`,
        Macro.if_(globalOptions.target, Macro.target("wanderer")).step(
          run.macro,
        ),
      );
    } while (
      get("lastCopyableMonster") === $monster`Government agent` ||
      lastAdventureWasWeird({ extraEncounters: ["Lights Out in the Kitchen"] })
    );
  }
}

function pygmyOptions(equip: Item[] = []): FreeFightOptions {
  return {
    spec: () => ({
      equip,
      avoid: $items`Staff of Queso Escusado, stinky cheese sword`,
      bonuses: new Map([[$item`garbage sticker`, 100], ...magnifyingGlass()]),
    }),
    macroAllowsFamiliarActions: false,
    location: $location`The Hidden Bowling Alley`,
    monster: $monster`drunk pygmy`,
  };
}

function familiarSpec(underwater: boolean, fight: CopyTargetFight): OutfitSpec {
  if (
    ChestMimic.have() &&
    $familiar`Chest Mimic`.experience >= 50 &&
    get("_mimicEggsObtained") < 11 &&
    // switchmonster doesn't apply ML, meaning the target monsters die too quickly to get multiple eggs in
    !["Macrometeorite", "Powerful Glove", "Backup"].includes(fight.name)
  ) {
    return { familiar: $familiar`Chest Mimic` };
  }

  if (get("_badlyRomanticArrows") === 0) {
    if (
      !underwater &&
      have($familiar`Obtuse Angel`) &&
      (familiarEquippedEquipment($familiar`Obtuse Angel`) ===
        $item`quake of arrows` ||
        retrieveItem($item`quake of arrows`))
    ) {
      return {
        familiar: $familiar`Obtuse Angel`,
        famequip: $item`quake of arrows`,
      };
    }
    if (have($familiar`Reanimated Reanimator`)) {
      return { familiar: $familiar`Reanimated Reanimator` };
    }
  }

  if (isFreeAndCopyable(globalOptions.target)) {
    if (fight.gregariousReplace) {
      return {
        familiar: freeFightFamiliar(fight.location ?? globalOptions.target, {
          mode: "target",
          excludeFamiliar: [$familiar`Red-Nosed Snapper`],
        }),
      };
    }
    return {
      familiar: freeFightFamiliar(fight.location ?? globalOptions.target, {
        mode: "target",
      }),
    };
  }

  return { familiar: meatFamiliar() };
}

export function dailyFights(): void {
  if (myInebriety() > inebrietyLimit()) return;

  if (copyTargetSources.some((source) => source.potential())) {
    withStash($items`Spooky Putty sheet`, () => {
      // check if user wants to wish for the copy target before doing setup
      if (!getNextCopyTargetFight()) return;
      meatTargetSetup();
      if (targetingMeat()) runGarboQuests([EmbezzlerFightsQuest]);

      // PROFESSOR COPIES
      if (have($familiar`Pocket Professor`)) {
        const potentialPocketProfessorLectures = [
          {
            shouldDo: targetingMeat(),
            property: "_garbo_meatChain",
            macro: firstChainMacro,
            goalMaximize: (spec: OutfitSpec) => meatTargetOutfit(spec).dress(),
          },
          {
            shouldDo: true,
            property: "_garbo_weightChain",
            macro: secondChainMacro,
            goalMaximize: (spec: OutfitSpec) =>
              Outfit.from(
                { ...spec, modifier: ["Familiar Weight"] },
                new Error(`Unable to build outfit for weight chain!`),
              ).dress(),
          },
        ];

        for (const potentialLecture of potentialPocketProfessorLectures) {
          const { property, macro, goalMaximize, shouldDo } = potentialLecture;
          if (!shouldDo) continue;
          const fightSource = getNextCopyTargetFight();
          if (!fightSource) return;
          if (get(property, false)) continue;

          if (fightSource.gregariousReplace) {
            const crateIsSabered =
              get("_saberForceMonster") === $monster`crate`;
            const notEnoughCratesSabered = get("_saberForceMonsterCount") < 2;
            const weWantToSaberCrates =
              !crateIsSabered || notEnoughCratesSabered;
            if (weWantToSaberCrates) saberCrateIfSafe();
          }

          const chip = $item`Pocket Professor memory chip`;
          const jacks = $item`box of Familiar Jacks`;
          useFamiliar($familiar`Pocket Professor`);
          if (!have(chip)) {
            if (mallPrice(jacks) < mallPrice(chip)) {
              retrieveItem(jacks);
              use(jacks);
            } else {
              retrieveItem(chip);
            }
          }

          const profSpec: OutfitSpec = {
            familiar: $familiar`Pocket Professor`,
            avoid: $items`Roman Candelabra`,
          };
          if (have(chip)) {
            profSpec.famequip = chip;
          }

          goalMaximize({ ...profSpec, ...fightSource.spec });

          if (
            get("_pocketProfessorLectures") <
            PocketProfessor.totalAvailableLectures()
          ) {
            const startLectures = get("_pocketProfessorLectures");
            runTargetFight(fightSource, {
              macro: macro(),
              useAuto: false,
              action: "Pocket Professor",
            });
            eventLog.initialCopyTargetsFought +=
              1 + get("_pocketProfessorLectures") - startLectures;
            eventLog.copyTargetSources.push(fightSource.name);
            eventLog.copyTargetSources.push(
              ...new Array<string>(
                get("_pocketProfessorLectures") - startLectures,
              ).fill("Pocket Professor"),
            );
          }
          set(property, true);
          postCombatActions();
          const predictedNextFight = getNextCopyTargetFight();
          if (!predictedNextFight?.draggable) doSausage();
          doGhost();
          startWandererCounter();
        }
      }

      useFamiliar(meatFamiliar());

      // REMAINING TARGET MONSTER FIGHTS
      let nextFight = getNextCopyTargetFight();
      while (nextFight !== null && myAdventures()) {
        print(`Running fight ${nextFight.name}`);
        const startTurns = totalTurnsPlayed();

        if (
          nextFight.draggable === "backup" &&
          have($skill`Musk of the Moose`) &&
          !have($effect`Musk of the Moose`)
        ) {
          useSkill($skill`Musk of the Moose`);
        }

        if (nextFight.gregariousReplace) {
          const crateIsSabered = get("_saberForceMonster") === $monster`crate`;
          const notEnoughCratesSabered = get("_saberForceMonsterCount") < 2;
          const weWantToSaberCrates = !crateIsSabered || notEnoughCratesSabered;
          if (weWantToSaberCrates) saberCrateIfSafe();
        }

        const location = new TargetFightRunOptions(nextFight).location;
        const underwater = location.environment === "underwater";

        const famSpec = familiarSpec(underwater, nextFight);

        if (
          famSpec.familiar === $familiar`Red-Nosed Snapper` &&
          Snapper.getTrackedPhylum() !== globalOptions.target.phylum
        ) {
          Snapper.trackPhylum(globalOptions.target.phylum);
        }

        setLocation(location);
        meatTargetOutfit({ ...nextFight.spec, ...famSpec }, location).dress();

        runTargetFight(nextFight, { action: nextFight.name });
        postCombatActions();

        print(`Finished ${nextFight.name}`);
        if (
          totalTurnsPlayed() - startTurns === 1 &&
          get("lastCopyableMonster") === globalOptions.target &&
          (nextFight.wrongEncounterName ||
            get("lastEncounter") === globalOptions.target.name)
        ) {
          eventLog.initialCopyTargetsFought++;
          eventLog.copyTargetSources.push(nextFight.name);
        }

        nextFight = getNextCopyTargetFight();

        if (
          romanticMonsterImpossible() &&
          (!nextFight || !nextFight.draggable)
        ) {
          doSausage();
        }
        doGhost();
        startWandererCounter();
      }
    });
  }
}

type FreeFightOptions = {
  cost?: () => number;
  spec?: Delayed<OutfitSpec>;
  noncombat?: () => boolean;
  effects?: () => Effect[];

  // Tells us if this fight can reasonably be expected to do familiar
  // actions like meatifying matter, or crimbo shrub red raying.
  // Defaults to true.
  macroAllowsFamiliarActions?: boolean;
} & RequireAtLeastOne<{
  location: Delayed<Location>;
  monster: Delayed<Monster>;
  wandererDetails: WanderDetails;
}>;

let consecutiveNonFreeFights = 0;
class FreeFight {
  available: () => number | boolean;
  run: () => void;
  tentacle: boolean;
  options: FreeFightOptions;

  constructor(
    available: () => number | boolean,
    run: () => void,
    tentacle: boolean,
    options: FreeFightOptions,
  ) {
    this.available = available;
    this.run = run;
    this.tentacle = tentacle;
    this.options = options;
  }

  destination(): Location | WanderDetails {
    return (
      this.options.wandererDetails ??
      undelay(this.options.location) ??
      $location.none
    );
  }

  outfit(spec: OutfitSpec, additonalOptions: FreeFightOutfitMenuOptions = {}) {
    return freeFightOutfit(
      spec,
      this.options.monster
        ? {
            location: this.destination(),
            target: undelay(this.options.monster),
          }
        : this.destination(),
      additonalOptions,
    );
  }

  isAvailable(): boolean {
    if (myAdventures() === 0) return false;
    const avail = this.available();
    return typeof avail === "number" ? avail > 0 : avail;
  }

  getSpec(noncombat = false): OutfitSpec {
    const spec = undelay(this.options.spec ?? {});
    if (noncombat) delete spec.familiar;
    return spec;
  }

  runAll() {
    if (!this.isAvailable()) return;
    if ((this.options.cost?.() ?? 0) > globalOptions.prefs.valueOfFreeFight) {
      return;
    }
    while (this.isAvailable()) {
      voidMonster();
      const noncombat = !!this.options?.noncombat?.();
      const effects = this.options.effects?.() ?? [];
      freeFightMood(...effects).execute();
      this.outfit(this.getSpec(noncombat)).dress();
      safeRestore();
      const curTurncount = myTurncount();
      withMacro(Macro.basicCombat(), this.run);
      if (myTurncount() > curTurncount) consecutiveNonFreeFights++;
      else consecutiveNonFreeFights = 0;
      if (consecutiveNonFreeFights >= 5) {
        throw new Error("The last 5 FreeRunFights were not free!");
      }
      postCombatActions();
      // Slot in our Professor Thesis if it's become available
      if (!have($effect`Feeling Lost`)) deliverThesisIfAble();
    }
  }
}

class FreeRunFight extends FreeFight {
  freeRun: (runSource: ActionSource) => void;
  constraints: FindActionSourceConstraints;

  constructor(
    available: () => number | boolean,
    run: (runSource: ActionSource) => void,
    options: FreeFightOptions,
    freeRunPicker: FindActionSourceConstraints = {},
  ) {
    super(available, () => null, false, {
      ...options,
      macroAllowsFamiliarActions: false,
    });
    this.freeRun = run;
    this.constraints = freeRunPicker;
  }

  runAll() {
    if (!this.isAvailable()) return;
    if (
      (this.options.cost ? this.options.cost() : 0) >
      globalOptions.prefs.valueOfFreeFight
    ) {
      return;
    }
    while (this.isAvailable()) {
      const initialSpec = undelay(this.options.spec ?? {});
      const constraints = {
        ...freeRunConstraints(initialSpec),
        noFamiliar: () => "familiar" in initialSpec,
        ...this.constraints,
      };
      const runSource = tryFindFreeRunOrBanish(constraints);
      if (!runSource) break;
      runSource.constraints.preparation?.();
      const mergingOutfit = Outfit.from(
        initialSpec,
        new Error(`Failed to build outfit from ${JSON.stringify(initialSpec)}`),
      );
      mergingOutfit.equip(toSpec(runSource));
      this.outfit(mergingOutfit.spec(), {
        familiarOptions: { mode: "run" },
      }).dress();
      freeFightMood(...(this.options.effects?.() ?? []));
      safeRestore();
      const curTurncount = myTurncount();
      withMacro(Macro.step(runSource.macro), () => this.freeRun(runSource));
      if (myTurncount() > curTurncount) consecutiveNonFreeFights++;
      else consecutiveNonFreeFights = 0;
      if (consecutiveNonFreeFights >= 5) {
        throw new Error("The last 5 FreeRunFights were not free!");
      }
      postCombatActions();
    }
  }
}

const pygmyBanishHandlers = [
  {
    pygmy: $monster`pygmy bowler`,
    skill: $skill`Snokebomb`,
    check: "_snokebombUsed",
    limit: getUsingFreeBunnyBanish() ? 1 : 3,
    item: $item`Louder Than Bomb`,
  },
  {
    pygmy: $monster`pygmy orderlies`,
    skill: $skill`Feel Hatred`,
    check: "_feelHatredUsed",
    limit: 3,
    item: $item`divine champagne popper`,
  },
  {
    pygmy: $monster`pygmy janitor`,
    skill: undefined,
    check: undefined,
    limit: 0,
    item: $item`tennis ball`,
  },
] as const;

const sniffSources: MonsterProperty[] = [
  "_gallapagosMonster",
  "olfactedMonster",
  "_latteMonster",
  "motifMonster",
  "longConMonster",
];
const pygmySniffed = () =>
  sniffSources.some((source) =>
    pygmyBanishHandlers.some(({ pygmy }) => pygmy === get(source)),
  );

const pygmyMacro = () =>
  Macro.step(
    ...pygmyBanishHandlers.map(({ pygmy, skill, item, check, limit }) =>
      Macro.externalIf(
        (check ? get(check) : Infinity) < limit,
        Macro.if_(
          pygmy,
          skill ? Macro.trySkill(skill).item(item) : Macro.item(item),
        ),
        Macro.if_(pygmy, Macro.item(item)),
      ),
    ),
  )
    .if_($monster`drunk pygmy`, Macro.trySkill($skill`Extract`).trySingAlong())
    .ifInnateWanderer(Macro.basicCombat())
    .abort();

function getStenchLocation() {
  return (
    $locations`Uncle Gator's Country Fun-Time Liquid Waste Sluice, The Hippy Camp (Bombed Back to the Stone Age), The Dark and Spooky Swamp`.find(
      (l) => canAdventure(l),
    ) ?? $location.none
  );
}

function bowlOfScorpionsAvailable() {
  if (get("hiddenTavernUnlock") === myAscensions()) {
    return true;
  } else if (globalOptions.triedToUnlockHiddenTavern) {
    return false;
  } else {
    globalOptions.triedToUnlockHiddenTavern = true;
    retrieveItem($item`book of matches`);
    if (have($item`book of matches`)) {
      use($item`book of matches`);
    }
    return (
      get("hiddenTavernUnlock") === myAscensions() ||
      mallPrice($item`Bowl of Scorpions`) < 1000
    );
  }
}

function molemanReady() {
  return have($item`molehill mountain`) && !get("_molehillMountainUsed");
}

const freeFightSources = [
  new FreeFight(
    () => (wantPills() ? 5 - get("_saberForceUses") : 0),
    () => {
      if (have($familiar`Red-Nosed Snapper`)) {
        cliExecute(`snapper ${$phylum`dude`}`);
      }
      setChoice(1387, 3);
      if (
        have($skill`Comprehensive Cartography`) &&
        get("_monstersMapped") <
          (getBestItemStealZone(true) && get("_fireExtinguisherCharge") >= 10
            ? 2
            : 3) // Save a map to use for polar vortex
      ) {
        withMacro(Macro.skill($skill`Use the Force`), () => {
          mapMonster(
            $location`Domed City of Grimacia`,
            $monster`grizzled survivor`,
          );
          runCombat();
          runChoice(-1);
        });
      } else {
        if (numericModifier($item`Grimacite guayabera`, "Monster Level") < 40) {
          retrieveItem(1, $item`tennis ball`);
          retrieveItem(1, $item`handful of split pea soup`);
          retrieveItem(1, $item`divine champagne popper`);
        }
        const snokeLimit = getUsingFreeBunnyBanish() ? 1 : 3;
        garboAdventure(
          $location`Domed City of Grimacia`,
          Macro.if_(
            $monster`alielf`,
            Macro.trySkill(
              $skill`Asdon Martin: Spring-Loaded Front Bumper`,
            ).tryItem($item`handful of split pea soup`),
          )
            .if_(
              $monster`cat-alien`,
              get("_snokebombUsed") < snokeLimit
                ? Macro.trySkill($skill`Snokebomb`).item($item`tennis ball`)
                : Macro.item($item`tennis ball`),
            )
            .if_(
              $monster`dog-alien`,
              Macro.trySkill($skill`Feel Hatred`).tryItem(
                $item`divine champagne popper`,
              ),
            )
            .step("pickpocket")
            .skill($skill`Use the Force`),
        );
      }
    },
    false,
    {
      spec: () => {
        const canPickPocket =
          myClass() === $class`Accordion Thief` ||
          myClass() === $class`Disco Bandit`;
        const bestPickpocketItem =
          $items`tiny black hole, mime army infiltration glove`.find(
            (item) => have(item) && canEquip(item),
          );
        const spec: OutfitSpec = {
          modifier: ["1000 Pickpocket Chance"],
          equip: $items`Fourth of May Cosplay Saber`,
        };
        if (have($familiar`Red-Nosed Snapper`)) {
          spec.familiar = $familiar`Red-Nosed Snapper`;
        }
        if (!canPickPocket && bestPickpocketItem) {
          spec.equip?.push(bestPickpocketItem);
        }

        return spec;
      },
      effects: () => $effects`Transpondent`,
      macroAllowsFamiliarActions: false,
      location: $location`Domed City of Grimacia`,
    },
  ),

  // Initial 9 Pygmy fights
  new FreeFight(
    () =>
      get("questL11Worship") !== "unstarted" &&
      bowlOfScorpionsAvailable() &&
      !pygmySniffed()
        ? clamp(9 - get("_drunkPygmyBanishes"), 0, 9)
        : 0,
    () => {
      putCloset(itemAmount($item`bowling ball`), $item`bowling ball`);
      retrieveItem(
        clamp(9 - get("_drunkPygmyBanishes"), 0, 9),
        $item`Bowl of Scorpions`,
      );
      retrieveItem($item`Louder Than Bomb`);
      retrieveItem($item`tennis ball`);
      retrieveItem($item`divine champagne popper`);
      garboAdventure($location`The Hidden Bowling Alley`, pygmyMacro());
    },
    true,
    {
      cost: () => {
        const banishers = pygmyBanishHandlers
          .filter(
            ({ skill, check, limit }) =>
              !skill || !have(skill) || (check && get(check) >= limit),
          )
          .map(({ item }) => item);
        return (
          retrievePrice($item`Bowl of Scorpions`) +
          sum(banishers, mallPrice) / 11
        );
      },
      location: $location`The Hidden Bowling Alley`,
      monster: $monster`drunk pygmy`,
    },
  ),

  // 10th Pygmy fight. If we have an orb, equip it for this fight, to save for later
  new FreeFight(
    () =>
      get("questL11Worship") !== "unstarted" &&
      get("_drunkPygmyBanishes") === 9 &&
      !pygmySniffed(),
    () => {
      putCloset(itemAmount($item`bowling ball`), $item`bowling ball`);
      retrieveItem($item`Bowl of Scorpions`);
      garboAdventure($location`The Hidden Bowling Alley`, pygmyMacro());
    },
    true,
    pygmyOptions($items`miniature crystal ball`.filter((item) => have(item))),
  ),
  // 11th pygmy fight if we lack a saber
  new FreeFight(
    () =>
      get("questL11Worship") !== "unstarted" &&
      get("_drunkPygmyBanishes") === 10 &&
      (!have($item`Fourth of May Cosplay Saber`) ||
        crateStrategy() === "Saber") &&
      !pygmySniffed(),
    () => {
      putCloset(itemAmount($item`bowling ball`), $item`bowling ball`);
      retrieveItem($item`Bowl of Scorpions`);
      garboAdventureAuto($location`The Hidden Bowling Alley`, pygmyMacro());
    },
    true,
    pygmyOptions(),
  ),

  // 11th+ pygmy fight if we have a saber- saber friends
  new FreeFight(
    () => {
      const rightTime =
        have($item`Fourth of May Cosplay Saber`) &&
        crateStrategy() !== "Saber" &&
        get("_drunkPygmyBanishes") >= 10;
      const saberedMonster = get("_saberForceMonster");
      const wrongPygmySabered =
        saberedMonster &&
        $monsters`pygmy orderlies, pygmy bowler, pygmy janitor`.includes(
          saberedMonster,
        );
      const drunksCanAppear =
        get("_drunkPygmyBanishes") === 10 ||
        (saberedMonster === $monster`drunk pygmy` &&
          get("_saberForceMonsterCount"));
      return (
        get("questL11Worship") !== "unstarted" &&
        rightTime &&
        !wrongPygmySabered &&
        drunksCanAppear &&
        !pygmySniffed()
      );
    },
    () => {
      if (
        (get("_saberForceMonster") !== $monster`drunk pygmy` ||
          get("_saberForceMonsterCount") === 1) &&
        get("_saberForceUses") < 5
      ) {
        putCloset(itemAmount($item`bowling ball`), $item`bowling ball`);
        putCloset(
          itemAmount($item`Bowl of Scorpions`),
          $item`Bowl of Scorpions`,
        );
        garboAdventure(
          $location`The Hidden Bowling Alley`,
          Macro.skill($skill`Use the Force`),
        );
      } else {
        if (closetAmount($item`Bowl of Scorpions`) > 0) {
          takeCloset(
            closetAmount($item`Bowl of Scorpions`),
            $item`Bowl of Scorpions`,
          );
        } else retrieveItem($item`Bowl of Scorpions`);
        garboAdventure($location`The Hidden Bowling Alley`, pygmyMacro());
      }
    },
    false,
    pygmyOptions($items`Fourth of May Cosplay Saber`),
  ),

  // Finally, saber or not, if we have a drunk pygmy in our crystal ball, let it out.
  new FreeFight(
    () =>
      get("questL11Worship") !== "unstarted" &&
      CrystalBall.ponder().get($location`The Hidden Bowling Alley`) ===
        $monster`drunk pygmy` &&
      get("_drunkPygmyBanishes") >= 11 &&
      !pygmySniffed(),
    () => {
      putCloset(itemAmount($item`bowling ball`), $item`bowling ball`);
      retrieveItem(1, $item`Bowl of Scorpions`);
      garboAdventure(
        $location`The Hidden Bowling Alley`,
        Macro.if_($monster`drunk pygmy`, pygmyMacro()).abort(),
      );
    },
    true,
    pygmyOptions($items`miniature crystal ball`.filter((item) => have(item))),
  ),

  new FreeFight(
    () =>
      have($item`Time-Spinner`) &&
      !doingGregFight() &&
      $location`The Hidden Bowling Alley`.combatQueue.includes("drunk pygmy") &&
      get("_timeSpinnerMinutesUsed") < 8,
    () => {
      retrieveItem($item`Bowl of Scorpions`);
      Macro.trySkill($skill`Extract`)
        .trySingAlong()
        .setAutoAttack();
      visitUrl(`inv_use.php?whichitem=${toInt($item`Time-Spinner`)}`);
      runChoice(1);
      visitUrl(
        `choice.php?whichchoice=1196&monid=${$monster`drunk pygmy`.id}&option=1`,
      );
    },
    true,
    pygmyOptions(),
  ),
  new FreeFight(
    () =>
      get("neverendingPartyAlways") && questStep("_questPartyFair") < 999
        ? clamp(
            10 -
              get("_neverendingPartyFreeTurns") -
              (!molemanReady() &&
              !get("_thesisDelivered") &&
              have($familiar`Pocket Professor`)
                ? 1
                : 0),
            0,
            10,
          )
        : 0,
    () => {
      const constructedMacro = Macro.tryHaveSkill(
        $skill`Feel Pride`,
      ).basicCombat();
      setNepQuestChoicesAndPrepItems();
      garboAdventure($location`The Neverending Party`, constructedMacro);
    },
    true,
    {
      spec: () => ({
        modifier:
          get("_questPartyFairQuest") === "trash"
            ? ["100 Item Drop"]
            : get("_questPartyFairQuest") === "dj"
              ? ["100 Meat Drop"]
              : [],
        equip: get("_partyHard")
          ? $items`PARTY HARD T-shirt`
          : have($item`January's Garbage Tote`) &&
              (!have($item`broken champagne bottle`) ||
                get("garbageChampagneCharge") === 0) &&
              (!have($item`deceased crimbo tree`) ||
                get("garbageTreeCharge") === 0)
            ? $items`makeshift garbage shirt`
            : [],
      }),
      location: $location`The Neverending Party`,
    },
  ),

  // Get a li'l ninja costume for 150% item drop
  new FreeFight(
    () =>
      !have($item`li'l ninja costume`) &&
      have($familiar`Trick-or-Treating Tot`) &&
      !get("_firedJokestersGun") &&
      have($item`The Jokester's gun`) &&
      canEquip($item`The Jokester's gun`) &&
      questStep("questL08Trapper") >= 2,
    () =>
      garboAdventure(
        $location`Lair of the Ninja Snowmen`,
        Macro.skill($skill`Fire the Jokester's Gun`).abort(),
      ),
    true,
    {
      spec: { equip: $items`The Jokester's gun` },
      macroAllowsFamiliarActions: false,
      location: $location`Lair of the Ninja Snowmen`,
    },
  ),

  // Fallback for li'l ninja costume if Lair of the Ninja Snowmen is unavailable
  new FreeFight(
    () =>
      !have($item`li'l ninja costume`) &&
      have($familiar`Trick-or-Treating Tot`) &&
      !get("_firedJokestersGun") &&
      have($item`The Jokester's gun`) &&
      canEquip($item`The Jokester's gun`) &&
      Cartography.availableMaps() > 0,
    () => {
      try {
        Macro.skill($skill`Fire the Jokester's Gun`)
          .abort()
          .setAutoAttack();
        mapMonster($location`The Haiku Dungeon`, $monster`amateur ninja`);
      } finally {
        setAutoAttack(0);
      }
    },
    true,
    {
      spec: { equip: $items`The Jokester's gun` },
      macroAllowsFamiliarActions: false,
      location: $location`The Haiku Dungeon`,
      monster: $monster`amateur ninja`,
    },
  ),
  new FreeFight(
    () => {
      if (!have($item`closed-circuit pay phone`)) return false;
      // Check if we have or can get Shadow Affinity
      if (have($effect`Shadow Affinity`)) return true;
      if (
        !get("_shadowAffinityToday") &&
        !ClosedCircuitPayphone.rufusTarget()
      ) {
        return true;
      }

      if (
        get("rufusQuestType") === "items" ||
        get("rufusQuestType") === "entity"
      ) {
        // TODO: Skip bosses for now, until we can fight them
        return false; // We deemed it unprofitable to complete the quest in potionSetup
      }
      if (get("encountersUntilSRChoice") === 0) {
        // Target is either an artifact or a boss
        return true; // Get the artifact or kill the boss immediately for free
      }

      // Consider forcing noncombats below:
      if (get("noncombatForcerActive")) return true; // If it's already forced, no problem
      if (willYachtzee()) return false; // NCs are better when yachtzeeing, probably
      // TODO: With the KoL update, is there a function for checking if an NC is already forced?
      if (shouldClara("shadow waters")) {
        return true;
      }

      // TODO: Calculate forcing for shadow waters against using the +5 fam weight buff
      if (CinchoDeMayo.have() && CinchoDeMayo.totalAvailableCinch() >= 60) {
        return true;
      }
      return false; // It costs turns to do anything else here
    },
    () => {
      if (have($item`Rufus's shadow lodestone`)) {
        setChoice(1500, 2); // Turn in lodestone if you have it
        adv1(bestShadowRift(), -1, "");
      }
      if (
        !get("_shadowAffinityToday") &&
        !ClosedCircuitPayphone.rufusTarget()
      ) {
        ClosedCircuitPayphone.chooseQuest(() => 2); // Choose an artifact (not supporting boss for now)
        aprilFoolsRufus();
      }

      runShadowRiftTurn();

      if (
        get("encountersUntilSRChoice") === 0 ||
        get("noncombatForcerActive")
      ) {
        if (
          ClosedCircuitPayphone.have() &&
          !ClosedCircuitPayphone.rufusTarget()
        ) {
          ClosedCircuitPayphone.chooseQuest(() => 2);
          aprilFoolsRufus();
        }
        adv1(bestShadowRift(), -1, ""); // grab the NC
      }

      if (questStep("questRufus") === 1) {
        withChoice(1498, 1, () => use($item`closed-circuit pay phone`));
      }

      if (have($item`Rufus's shadow lodestone`)) {
        setChoice(1500, 2); // Check for lodestone at the end again
        adv1(bestShadowRift(), -1, "");
      }

      if (
        !have($effect`Shadow Affinity`) &&
        get("encountersUntilSRChoice") !== 0
      ) {
        setLocation($location.none); // Reset location to not affect mafia's item drop calculations
      }
    },
    true,
    {
      location: $location`Shadow Rift`,
    },
  ),
];

const priorityFreeRunFightSources = [
  new FreeRunFight(
    () =>
      have($familiar`Patriotic Eagle`) &&
      !have($effect`Citizen of a Zone`) &&
      $locations`Barf Mountain, The Fun-Guy Mansion`.some((l) =>
        canAdventure(l),
      ),
    (runSource: ActionSource) => {
      const location = canAdventure($location`Barf Mountain`)
        ? $location`Barf Mountain`
        : $location`The Fun-Guy Mansion`;
      garboAdventure(
        location,
        Macro.skill($skill`%fn, let's pledge allegiance to a Zone`).step(
          runSource.macro,
        ),
      );
    },
    {
      spec: {
        familiar: $familiar`Patriotic Eagle`,
        famequip: $items`little bitty bathysphere, das boot`,
        modifier: ["ML 100 Max", "-Familiar Weight"],
        avoid: $items`Drunkula's wineglass`,
      },
      location: canAdventure($location`Barf Mountain`)
        ? $location`Barf Mountain`
        : $location`The Fun-Guy Mansion`,
    },
  ),
];

function latteFight(
  ingredient: Exclude<Latte.Ingredient, "vanilla" | "cinnamon" | "pumpkin">,
): FreeRunFight {
  return new FreeRunFight(
    () =>
      shouldUnlockIngredients() &&
      !Latte.ingredientsUnlocked().includes(ingredient) &&
      canAdventure(Latte.locationOf(ingredient)),
    (runSource: ActionSource) => {
      const targetLocation = Latte.locationOf(ingredient);
      propertyManager.setChoices(wanderer().getChoices(targetLocation));
      garboAdventure(targetLocation, runSource.macro);
    },
    {
      spec: { equip: $items`latte lovers member's mug` },
      location: Latte.locationOf(ingredient),
    },
    freeRunConstraints({ equip: $items`latte lovers member's mug` }),
  );
}

const freeRunFightSources = [
  ...(["cajun", "rawhide", "carrot"] as const).map(latteFight),
  // Fire Extinguisher on best available target.
  new FreeRunFight(
    () =>
      ((have($item`industrial fire extinguisher`) &&
        get("_fireExtinguisherCharge") >= 10) ||
        (have($familiar`XO Skeleton`) && get("_xoHugsUsed") < 11) ||
        (have($item`bat wings`) && get("_batWingsSwoopUsed") < 11) ||
        (have($skill`Perpetrate Mild Evil`) &&
          get("_mildEvilPerpetrated") < 3)) &&
      get("_VYKEACompanionLevel") === 0 && // don't attempt this in case you re-run garbo after making a vykea furniture
      getBestItemStealZone() !== null,
    (runSource: ActionSource) => {
      setupItemStealZones();
      const best = getBestItemStealZone();
      if (!best) throw `Unable to find fire extinguisher zone?`;
      const mappingMonster =
        Cartography.availableMaps() > 0 && best.location.wanderers;
      const monsters = asArray(best.monster);
      if (best.preReq) best.preReq();
      const hasXO = myFamiliar() === $familiar`XO Skeleton`;
      if (myThrall() !== $thrall.none) useSkill($skill`Dismiss Pasta Thrall`);
      withMacro(
        Macro.if_(
          monsters.map((m) => `!monsterid ${m.id}`).join(" && "),
          runSource.macro,
        )
          .externalIf(
            hasXO && get("_xoHugsUsed") < 11,
            Macro.skill($skill`Hugs and Kisses!`),
          )
          .externalIf(
            !best.requireMapTheMonsters && hasXO && get("_xoHugsUsed") < 10,
            Macro.step(itemStealOlfact(best)),
          )
          .trySkillRepeat(
            $skill`Fire Extinguisher: Polar Vortex`,
            $skill`Perpetrate Mild Evil`,
            $skill`Swoop like a Bat`,
          )
          .step(runSource.macro),
        () => {
          if (mappingMonster) {
            mapMonster(best.location, monsters[0]);
          } else {
            adv1(best.location, -1, "");
          }
        },
        true,
      );
    },
    {
      spec: () => {
        const zone = getBestItemStealZone();
        const spec: OutfitSpec =
          have($familiar`XO Skeleton`) && get("_xoHugsUsed") < 11
            ? { familiar: $familiar`XO Skeleton`, equip: [] }
            : { equip: [] };
        if (
          have($item`industrial fire extinguisher`) &&
          get("_fireExtinguisherCharge") >= 10
        ) {
          spec.equip?.push($item`industrial fire extinguisher`);
        }
        if (BatWings.swoopsRemaining() > 0) {
          spec.equip?.push($item`bat wings`);
        }
        spec.modifier = zone?.maximize ?? [];
        return spec;
      },
      location: () => getBestItemStealZone()?.location ?? $location.none,
      monster: () => {
        const monsterTarget = getBestItemStealZone()?.monster;
        if (!monsterTarget) return $monster.none;
        return Array.isArray(monsterTarget) ? monsterTarget[0] : monsterTarget;
      },
    },
  ),
  new FreeRunFight(
    () =>
      have($familiar`Space Jellyfish`) &&
      get("_spaceJellyfishDrops") < 5 &&
      getStenchLocation() !== $location.none,
    (runSource: ActionSource) => {
      garboAdventure(
        getStenchLocation(),
        Macro.trySkill($skill`Extract Jelly`).step(runSource.macro),
      );
    },
    {
      spec: { familiar: $familiar`Space Jellyfish` },
      location: getStenchLocation,
    },
  ),
  new FreeRunFight(
    () =>
      !doingGregFight() &&
      have($familiar`Space Jellyfish`) &&
      have($skill`Meteor Lore`) &&
      get("_macrometeoriteUses") < 10 &&
      getStenchLocation() !== $location.none,
    (runSource: ActionSource) => {
      garboAdventure(
        getStenchLocation(),
        Macro.while_(
          `!pastround 28 && ${Macro.makeBALLSPredicate(
            $skill`Macrometeorite`,
          )}`,
          Macro.skill($skill`Extract Jelly`).skill($skill`Macrometeorite`),
        )
          .trySkill($skill`Extract Jelly`)
          .step(runSource.macro),
      );
    },
    {
      spec: { familiar: $familiar`Space Jellyfish` },
      location: getStenchLocation,
    },
  ),
  new FreeRunFight(
    () =>
      !doingGregFight() &&
      have($familiar`Space Jellyfish`) &&
      have($item`Powerful Glove`) &&
      get("_powerfulGloveBatteryPowerUsed") < 91 &&
      getStenchLocation() !== $location.none,
    (runSource: ActionSource) => {
      garboAdventure(
        getStenchLocation(),
        Macro.while_(
          `!pastround 28 && ${Macro.makeBALLSPredicate(
            $skill`CHEAT CODE: Replace Enemy`,
          )}`,
          Macro.skill($skill`Extract Jelly`).skill(
            $skill`CHEAT CODE: Replace Enemy`,
          ),
        )
          .trySkill($skill`Extract Jelly`)
          .step(runSource.macro),
      );
    },
    {
      spec: {
        familiar: $familiar`Space Jellyfish`,
        equip: $items`Powerful Glove`,
      },
      location: getStenchLocation,
    },
  ),
  new FreeFight(
    () =>
      GingerBread.available() &&
      get("gingerAdvanceClockUnlocked") &&
      !get("_gingerbreadClockVisited") &&
      get("_gingerbreadCityTurns") <= 3,
    () => {
      propertyManager.setChoices({
        1215: 1, // Gingerbread Civic Center advance clock
      });
      garboAdventure(
        $location`Gingerbread Civic Center`,
        Macro.abortWithMsg(
          `Expected "Setting the Clock" but ended up in combat.`,
        ),
      );
    },
    false,
    {
      noncombat: () => true,
      location: $location`Gingerbread Civic Center`,
    },
  ),
  new FreeRunFight(
    () => GingerBread.available() && GingerBread.minutesToNoon() > 0,
    (runSource: ActionSource) => {
      propertyManager.setChoices({
        1215: 1, // Gingerbread Civic Center advance clock
      });
      garboAdventure($location`Gingerbread Civic Center`, runSource.macro);
      if (
        [
          "Even Tamer Than Usual",
          "Never Break the Chain",
          "Close, but Yes Cigar",
          "Armchair Quarterback",
        ].includes(get("lastEncounter"))
      ) {
        set("_gingerbreadCityTurns", 1 + get("_gingerbreadCityTurns"));
      }
    },
    {
      spec: { bonuses: new Map([[$item`carnivorous potted plant`, 100]]) },
      location: $location`Gingerbread Civic Center`,
    },
  ),
  new FreeFight(
    () => GingerBread.available() && GingerBread.minutesToNoon() === 0,
    () => {
      propertyManager.setChoices({
        1204: 1, // Gingerbread Train Station Noon random candy
      });
      garboAdventure(
        $location`Gingerbread Train Station`,
        Macro.abortWithMsg(
          `Expected "Noon at the Train Station" but ended up in combat.`,
        ),
      );
    },
    false,
    {
      noncombat: () => true,
      location: $location`Gingerbread Train Station`,
    },
  ),
  new FreeRunFight(
    () =>
      GingerBread.available() &&
      GingerBread.minutesToMidnight() > 0 &&
      GingerBread.minutesToNoon() < 0 &&
      (availableAmount($item`sprinkles`) > 5 || haveOutfit("gingerbread best")),
    (runSource: ActionSource) => {
      propertyManager.setChoices({
        1215: 1, // Gingerbread Civic Center advance clock
      });
      garboAdventure($location`Gingerbread Civic Center`, runSource.macro);
      if (
        [
          "Even Tamer Than Usual",
          "Never Break the Chain",
          "Close, but Yes Cigar",
          "Armchair Quarterback",
        ].includes(get("lastEncounter"))
      ) {
        set("_gingerbreadCityTurns", 1 + get("_gingerbreadCityTurns"));
      }
    },
    {
      spec: { bonuses: new Map([[$item`carnivorous potted plant`, 100]]) },
      location: $location`Gingerbread Civic Center`,
    },
  ),
  new FreeFight(
    () =>
      GingerBread.available() &&
      GingerBread.minutesToMidnight() === 0 &&
      (availableAmount($item`sprinkles`) > 5 || haveOutfit("gingerbread best")),
    () => {
      const { choices, location } = bestMidnightAvailable();
      propertyManager.setChoices(choices);
      if (location === $location`Gingerbread Upscale Retail District`) {
        outfit("gingerbread best");
      }
      garboAdventure(
        location,
        Macro.abortWithMsg(
          "We thought it was Midnight here in Gingerbread City, but we're in a fight!",
        ),
      );
    },
    false,
    {
      noncombat: () => true,
      location: () => bestMidnightAvailable().location,
    },
  ),
  // Try for an ultra-rare with mayfly runs and pickpocket if we have a manuel to detect monster hp ;)
  new FreeRunFight(
    () =>
      monsterManuelAvailable() &&
      have($item`mayfly bait necklace`) &&
      canAdventure($location`Cobb's Knob Menagerie, Level 1`) &&
      get("_mayflySummons") < 30,
    (runSource: ActionSource) => {
      const willSurvivePassive = `monsterhpabove ${maxPassiveDamage()}`;
      garboAdventure(
        $location`Cobb's Knob Menagerie, Level 1`,
        Macro.if_($monster`QuickBASIC elemental`, Macro.basicCombat())
          .if_(
            $monster`BASIC Elemental`,
            Macro.if_(willSurvivePassive, Macro.step("pickpocket"))
              .externalIf(
                have($skill`Transcendent Olfaction`) &&
                  get("_olfactionsUsed") < 1,
                Macro.if_(
                  willSurvivePassive,
                  Macro.trySkill($skill`Transcendent Olfaction`),
                ),
              )
              .externalIf(
                have($skill`Gallapagosian Mating Call`) &&
                  get("_gallapagosMonster") !== $monster`BASIC Elemental`,
                Macro.if_(
                  willSurvivePassive,
                  Macro.skill($skill`Gallapagosian Mating Call`),
                ),
              )
              .trySkill($skill`Summon Mayfly Swarm`),
          )
          .step(runSource.macro),
      );
    },
    {
      spec: () => {
        const canPickPocket =
          myClass() === $class`Accordion Thief` ||
          myClass() === $class`Disco Bandit`;
        const bestPickpocketItem =
          $items`tiny black hole, mime army infiltration glove`.find(
            (item) => have(item) && canEquip(item),
          );
        // Base drop is 30%, so 1% pickpocket gives .003
        const pickPocketValue = 0.003 * garboValue($item`GOTO`);
        const spec: OutfitSpec = {
          equip: $items`mayfly bait necklace`,
          bonuses: new Map([[$item`carnivorous potted plant`, 100]]),
          familiar: freeFightFamiliar(
            $location`Cobb's Knob Menagerie, Level 1`,
            {
              allowAttackFamiliars: false,
              mode: "run",
            },
          ),
        };
        if (!canPickPocket && bestPickpocketItem) {
          spec.equip?.push(bestPickpocketItem);
        }
        if (canPickPocket || bestPickpocketItem) {
          spec.modifier = [`${pickPocketValue} Pickpocket Chance`];
        }

        return spec;
      },
      location: $location`Cobb's Knob Menagerie, Level 1`,
    },
  ),
  // Try for mini-hipster\goth kid free fights with any remaining non-familiar free runs
  new FreeRunFight(
    () =>
      get("_hipsterAdv") < 7 &&
      (have($familiar`Mini-Hipster`) || have($familiar`Artistic Goth Kid`)),
    (runSource: ActionSource) => {
      const targetLocation = wanderer().getTarget("backup").location;
      propertyManager.setChoices(wanderer().getChoices(targetLocation));
      garboAdventure(
        targetLocation,
        Macro.if_(
          `(monsterid 969) || (monsterid 970) || (monsterid 971) || (monsterid 972) || (monsterid 973) || (monstername Black Crayon *)`,
          Macro.basicCombat(),
        ).step(runSource.macro),
      );
    },
    {
      spec: () => {
        if (have($familiar`Mini-Hipster`)) {
          return {
            familiar: $familiar`Mini-Hipster`,
            bonuses: new Map([
              [$item`ironic moustache`, garboValue($item`mole skin notebook`)],
              [$item`chiptune guitar`, garboValue($item`ironic knit cap`)],
              [
                $item`fixed-gear bicycle`,
                garboValue($item`ironic oversized sunglasses`),
              ],
            ]),
          };
        } else {
          return { familiar: $familiar`Artistic Goth Kid` };
        }
      },
      wandererDetails: "backup",
    },
  ),
  // Try to accelerate the shadow nc, if you're able to do a quest
  new FreeRunFight(
    () =>
      have($item`closed-circuit pay phone`) &&
      get("rufusQuestType") !== "items" &&
      !have($effect`Shadow Affinity`) &&
      get("encountersUntilSRChoice") > 0,
    (runSource: ActionSource) =>
      garboAdventure(bestShadowRift(), runSource.macro),
    {
      location: bestShadowRift,
    },
  ),
  // Try for an ultra-rare with mayfly runs if we didn't have a manuel ;)
  new FreeRunFight(
    () =>
      have($item`mayfly bait necklace`) &&
      canAdventure($location`Cobb's Knob Menagerie, Level 1`) &&
      get("_mayflySummons") < 30,
    (runSource: ActionSource) => {
      garboAdventure(
        $location`Cobb's Knob Menagerie, Level 1`,
        Macro.if_($monster`QuickBASIC elemental`, Macro.basicCombat())
          .if_(
            $monster`BASIC Elemental`,
            Macro.trySkill($skill`Summon Mayfly Swarm`),
          )
          .step(runSource.macro),
      );
    },
    {
      spec: {
        equip: $items`mayfly bait necklace`,
        bonuses: new Map([[$item`carnivorous potted plant`, 100]]),
      },
      location: $location`Cobb's Knob Menagerie, Level 1`,
    },
  ),
];

function targetCopiesInProgress(): boolean {
  return (
    get("beGregariousFightsLeft") > 0 ||
    get("_monsterHabitatsFightsLeft") > 0 ||
    !romanticMonsterImpossible() ||
    Counter.get("Digitize Monster") <= 0
  );
}

export function freeRunFights(): void {
  if (myInebriety() > inebrietyLimit()) return;
  if (targetCopiesInProgress()) return;

  propertyManager.setChoices({
    1387: 2, // "You will go find two friends and meet me here."
    1324: 5, // Fight a random partier
  });

  const onlyPriorityRuns =
    globalOptions.prefs.yachtzeechain &&
    !get("_garboYachtzeeChainCompleted", false);

  const stashRun = stashAmount($item`navel ring of navel gazing`)
    ? $items`navel ring of navel gazing`
    : stashAmount($item`Greatest American Pants`)
      ? $items`Greatest American Pants`
      : [];
  refreshStash();

  withStash(stashRun, () => {
    for (const priorityRunFight of priorityFreeRunFightSources) {
      priorityRunFight.runAll();
    }
    if (onlyPriorityRuns) return;
    for (const freeRunFightSource of freeRunFightSources) {
      freeRunFightSource.runAll();
    }
  });
}

export function freeFights(): void {
  if (myInebriety() > inebrietyLimit()) return;
  if (targetCopiesInProgress()) return;

  propertyManager.setChoices({
    1387: 2, // "You will go find two friends and meet me here."
    1324: 5, // Fight a random partier
  });

  freeRunFights();

  killRobortCreaturesForFree();

  // TODO: Run unconverted free fights
  // TODO: Once all is grimoirized, move Eldritch Horror free fight to the start and update the uneffect task, so that we can optimize Generic Summer Holiday tentacles.
  for (const freeFightSource of freeFightSources) {
    freeFightSource.runAll();
  }

  // TODO: Run grimorized free fights until all are converted
  // TODO: freeFightMood()
  runGarboQuests([PostQuest(), FreeFightQuest, FreeGiantSandwormQuest]);

  // Run any community endeavors
  runGarboQuests([PostQuest(), undelay(FreeMimicEggDonationQuest)]);

  tryFillLatte();
  postFreeFightDailySetup();
}

function setNepQuestChoicesAndPrepItems() {
  const quest = get("_questPartyFairQuest");

  if (quest === "food") {
    if (!questStep("_questPartyFair")) {
      setChoice(1324, 2); // Check out the kitchen
      setChoice(1326, 3); // Talk to the woman
    } else if (get("choiceAdventure1324") !== 5) {
      setChoice(1324, 5);
      print("Found Geraldine!", HIGHLIGHT);
      // Format of this property is count, space, item ID.
      const partyFairInfo = get("_questPartyFairProgress").split(" ");
      logMessage(
        `Geraldine wants ${partyFairInfo[0]} ${
          toItem(partyFairInfo[1]).plural
        }, please!`,
      );
    }
  } else if (quest === "booze") {
    if (!questStep("_questPartyFair")) {
      setChoice(1324, 3); // Go to the back yard
      setChoice(1327, 3); // Find Gerald
    } else if (get("choiceAdventure1324") !== 5) {
      setChoice(1324, 5);
      print("Found Gerald!", HIGHLIGHT);
      const partyFairInfo = get("_questPartyFairProgress").split(" ");
      logMessage(
        `Gerald wants ${partyFairInfo[0]} ${
          toItem(partyFairInfo[1]).plural
        }, please!`,
      );
    }
  } else {
    setChoice(1324, 5); // Pick a fight
  }
}

function thesisReady(): boolean {
  return (
    !get("_thesisDelivered") &&
    have($familiar`Pocket Professor`) &&
    $familiar`Pocket Professor`.experience >= 400
  );
}

export function deliverThesisIfAble(): void {
  if (!thesisReady()) return;
  const requiredThesisHP = 1296;

  let thesisLocation = $location`Uncle Gator's Country Fun-Time Liquid Waste Sluice`;
  let requiredMuscle = requiredThesisHP / 0.75 - 5;
  if (molemanReady()) {
    requiredMuscle = requiredThesisHP / 1.5 - 15;
    thesisLocation = $location`Noob Cave`; // We can trivially always adventure here
  } else if (
    (get("neverendingPartyAlways") || get("_neverEndingPartyToday")) &&
    questStep("_questPartyFair") < 999 &&
    !get("_partyHard")
  ) {
    // Set up NEP if we haven't yet
    setNepQuestChoicesAndPrepItems();
    thesisLocation = $location`The Neverending Party`;
    requiredMuscle = requiredThesisHP / 0.75 + 10;
  }
  // if running nobarf, might not have access to Uncle Gator's. Space is cheaper.
  else if (!canAdventure(thesisLocation)) {
    if (!have($item`transporter transponder`)) {
      acquire(1, $item`transporter transponder`, 10000);
    }
    use($item`transporter transponder`);
    thesisLocation = $location`Hamburglaris Shield Generator`;
    requiredMuscle = requiredThesisHP / 0.75 - 1;
  }

  freeFightOutfit(
    {
      modifier: ["100 Muscle"],
      familiar: $familiar`Pocket Professor`,
    },
    molemanReady() ? $monster`Moleman` : thesisLocation,
  ).dress();
  safeRestore();

  if (
    myBuffedstat($stat`Muscle`) < requiredMuscle &&
    have($item`Powerful Glove`) &&
    !have($effect`Triple-Sized`) &&
    get("_powerfulGloveBatteryPowerUsed") <= 95 &&
    // We only get triple-sized if it doesn't lose us a replace enemy use
    (get("_powerfulGloveBatteryPowerUsed") % 10 === 5 || !doingGregFight())
  ) {
    cliExecute("checkpoint");
    equip($slot`acc1`, $item`Powerful Glove`);
    ensureEffect($effect`Triple-Sized`);
    outfit("checkpoint");
  }
  cliExecute(`gain ${requiredMuscle} muscle`);

  if (molemanReady()) {
    withMacro(
      Macro.skill($skill`deliver your thesis!`),
      () => use($item`molehill mountain`),
      true,
    );
  } else {
    garboAdventure(thesisLocation, Macro.skill($skill`deliver your thesis!`));
  }
  postCombatActions();
}

export function doSausage(): void {
  if (!kramcoGuaranteed()) {
    return;
  }
  freeFightOutfit(
    { equip: $items`Kramco Sausage-o-Matic™` },
    { location: "wanderer", target: $monster`sausage goblin` },
  ).dress();
  const currentSausages = get("_sausageFights");
  do {
    const targetLocation = wanderer().getTarget("wanderer").location;
    propertyManager.setChoices(wanderer().getChoices(targetLocation));
    const goblin = $monster`sausage goblin`;
    freeFightOutfit(
      {
        equip: $items`Kramco Sausage-o-Matic™`,
      },
      { location: "wanderer", target: $monster`sausage goblin` },
    ).dress();
    garboAdventureAuto(
      targetLocation,
      Macro.if_(goblin, Macro.basicCombat())
        .ifInnateWanderer(Macro.basicCombat())
        .abortWithMsg(`Expected ${goblin} but got something else.`),
    );
  } while (get("_sausageFights") === currentSausages); // Try again if we hit an NC that didn't take a turn
  if (getAutoAttack() !== 0) setAutoAttack(0);
  postCombatActions();
}

function doGhost() {
  if (
    !have($item`protonic accelerator pack`) ||
    get("questPAGhost") === "unstarted"
  ) {
    return;
  }
  const ghostLocation = get("ghostLocation");
  if (!ghostLocation) return;
  propertyManager.setChoices(wanderer().getChoices(ghostLocation));
  freeFightOutfit(
    { equip: $items`protonic accelerator pack` },
    ghostLocation,
  ).dress();
  let currentTurncount;
  do {
    currentTurncount = myTurncount();
    garboAdventure(ghostLocation, Macro.ghostBustin());
  } while (
    get("ghostLocation") !== $location.none &&
    currentTurncount === myTurncount()
  );
  // Try again if we hit an NC that didn't take a turn
  postCombatActions();
}

type ItemStealZone = {
  item: Item;
  location: Location;
  monster: Monster | Monster[];
  dropRate: number;
  maximize: string[];
  requireMapTheMonsters: boolean; // When a zone has a choice we want to avoid
  isOpen: () => boolean;
  openCost: () => number;
  preReq: () => void;
};
const itemStealZones = [
  {
    location: $location`The Deep Dark Jungle`,
    monster: $monster`smoke monster`,
    item: $item`transdermal smoke patch`,
    dropRate: 1,
    maximize: [],
    requireMapTheMonsters: false,
    isOpen: () => get("_spookyAirportToday") || get("spookyAirportAlways"),
    openCost: () => 0,
    preReq: null,
  },
  {
    location: $location`The Ice Hotel`,
    monster: $monster`ice bartender`,
    item: $item`perfect ice cube`,
    dropRate: 1,
    maximize: [],
    requireMapTheMonsters: false,
    isOpen: () => get("_coldAirportToday") || get("coldAirportAlways"),
    openCost: () => 0,
    preReq: null,
  },
  {
    location: $location`The Haunted Library`,
    monster: $monster`bookbat`,
    item: $item`tattered scrap of paper`,
    dropRate: 1,
    maximize: ["99 monster level 100 max"], // Bookbats need up to +100 ML to survive the polar vortices
    requireMapTheMonsters: false,
    isOpen: () => have($item`[7302]Spookyraven library key`),
    openCost: () => 0,
    preReq: null,
  },
  {
    location: $location`The Stately Pleasure Dome`,
    monster: $monster`toothless mastiff bitch`,
    item: $item`disintegrating spiky collar`,
    dropRate: 1,
    maximize: ["99 muscle 100 max"], // Ensure mastiff is at least 100 hp
    requireMapTheMonsters: false,
    isOpen: () => true,
    openCost: () =>
      !have($effect`Absinthe-Minded`)
        ? mallPrice($item`tiny bottle of absinthe`)
        : 0,
    preReq: () => {
      if (!have($effect`Absinthe-Minded`)) {
        if (!have($item`tiny bottle of absinthe`)) {
          buy(1, $item`tiny bottle of absinthe`);
        }
        use($item`tiny bottle of absinthe`);
      }
    },
  },
  {
    location: $location`Twin Peak`,
    monster: $monsters`bearpig topiary animal, elephant (meatcar?) topiary animal, spider (duck?) topiary animal`,
    item: $item`rusty hedge trimmers`,
    dropRate: 0.5,
    maximize: ["99 monster level 11 max"], // Topiary animals need an extra 11 HP to survive polar vortices
    requireMapTheMonsters: false,
    isOpen: () =>
      myLevel() >= 9 &&
      get("chasmBridgeProgress") >= 30 &&
      get("twinPeakProgress") >= 15,
    openCost: () => 0,
    preReq: null,
  },
  {
    location: $location`The Hidden Temple`,
    monster: $monster`baa-relief sheep`,
    item: $item`stone wool`,
    requireMapTheMonsters: true,
    dropRate: 1,
    maximize: ["99 monster level 100 max"], // Sheeps need up to +100 ML to survive the polar vortices
    isOpen: () => get("lastTempleUnlock") === myAscensions(),
    openCost: () => 0,
    preReq: null,
  },
  ...$locations`Shadow Rift (The Ancient Buried Pyramid), Shadow Rift (The Hidden City), Shadow Rift (The Misspelled Cemetary)`.map(
    (location) => ({
      location,
      monster: $monster`shadow slab`,
      item: $item`shadow brick`,
      requireMapTheMonsters: false,
      dropRate: 1,
      isOpen: () => canAdventure(location),
      openCost: () => 0,
      preReq: null,
    }),
  ),
] as ItemStealZone[];

function getBestItemStealZone(
  canMapMonster = Cartography.availableMaps() > 0 ||
    Cartography.currentlyMapping(),
): ItemStealZone | null {
  const targets = itemStealZones.filter(
    (zone) =>
      zone.isOpen() &&
      (canMapMonster ||
        (!zone.requireMapTheMonsters &&
          asArray(zone.monster).some((m) => !isBanished(m)))),
  );
  const vorticesAvail = have($item`industrial fire extinguisher`)
    ? Math.floor(get("_fireExtinguisherCharge") / 10)
    : 0;
  const hugsAvail = have($familiar`XO Skeleton`)
    ? clamp(11 - get("_xoHugsUsed"), 0, 11)
    : 0;
  const swoopsAvail = BatWings.swoopsRemaining();
  const value = (zone: ItemStealZone): number => {
    // We have to divide hugs by 2 - will likely use a banish as a free run so we will be alternating zones.
    return (
      zone.dropRate *
        garboValue(zone.item) *
        (vorticesAvail + swoopsAvail + hugsAvail / 2) -
      zone.openCost()
    );
  };
  return targets.length ? maxBy(targets, value) : null;
}

function setupItemStealZones() {
  // Haunted Library is full of free noncombats
  propertyManager.setChoices({
    163: 4,
    164: 3,
    165: 4,
    166: 1,
    888: 5,
    889: 5,
  });
}

function itemStealOlfact(best: ItemStealZone) {
  // banishes and sniffs do not work in the shadow rifts
  return best.location.zone === "Shadow Rift"
    ? new Macro()
    : Macro.externalIf(
        have($skill`Transcendent Olfaction`) &&
          get("_olfactionsUsed") < 1 &&
          itemStealZones.every(
            (zone) =>
              !asArray(zone.monster).includes(
                get("olfactedMonster") as Monster,
              ),
          ),
        Macro.skill($skill`Transcendent Olfaction`),
      ).externalIf(
        have($skill`Gallapagosian Mating Call`) &&
          get("_gallapagosMonster") !== best.monster,
        Macro.skill($skill`Gallapagosian Mating Call`),
      );
}

const haveEnoughPills =
  clamp(availableAmount($item`synthetic dog hair pill`), 0, 100) +
    clamp(availableAmount($item`distention pill`), 0, 100) +
    availableAmount($item`Map to Safety Shelter Grimace Prime`) <
    200 &&
  availableAmount($item`Map to Safety Shelter Grimace Prime`) <
    ESTIMATED_OVERDRUNK_TURNS;
function wantPills(): boolean {
  return (
    have($item`Fourth of May Cosplay Saber`) &&
    crateStrategy() !== "Saber" &&
    haveEnoughPills
  );
}

function voidMonster(): void {
  if (
    get("cursedMagnifyingGlassCount") < 13 ||
    !have($item`cursed magnifying glass`) ||
    get("_voidFreeFights") >= 5
  ) {
    return;
  }

  freeFightOutfit(
    {
      equip: $items`cursed magnifying glass`,
    },
    "wanderer",
  ).dress();
  const targetLocation = wanderer().getTarget("wanderer").location;
  propertyManager.setChoices(wanderer().getChoices(targetLocation));
  garboAdventure(targetLocation, Macro.basicCombat());
  postCombatActions();
}

const BAD_CLL_MONSTERS = $monsters`alert mariachi`;
type FreeKill = { spec?: OutfitSpec; macro: Skill | Item; used: () => boolean };
const freeKills: FreeKill[] = [
  {
    spec: { equip: $items`The Jokester's gun` },
    macro: $skill`Fire the Jokester's Gun`,
    used: () => get("_firedJokestersGun"),
  },
  {
    spec: { equip: $items`Lil' Doctor™ bag` },
    macro: $skill`Chest X-Ray`,
    used: () => get("_chestXRayUsed") >= 3,
  },
  {
    macro: $skill`Shattering Punch`,
    used: () => get("_shatteringPunchUsed") >= 3,
  },
  {
    macro: $skill`Gingerbread Mob Hit`,
    used: () => get("_gingerbreadMobHitUsed"),
  },
  {
    macro: $item`replica bat-oomerang`,
    used: () => get("_usedReplicaBatoomerang") >= 3,
  },
];
const canUseSource = ({ spec, macro, used }: FreeKill) =>
  (spec?.equip?.every((i) => have(i)) ?? have(macro)) && !used();
function findFreeKill() {
  return freeKills.find(canUseSource) ?? null;
}

function killRobortCreaturesForFree() {
  if (!have($familiar`Robortender`)) return;

  const currentHeads = availableAmount($item`fish head`);
  let freeKill = findFreeKill();
  while (
    freeKill &&
    canAdventure($location`The Copperhead Club`) &&
    Cartography.availableMaps() > 0
  ) {
    if (have($effect`Crappily Disguised as a Waiter`)) {
      setChoice(855, 4);
      garboAdventure($location`The Copperhead Club`, Macro.abort());
    }
    freeFightOutfit(
      {
        ...freeKill.spec,
        familiar: $familiar`Robortender`,
      },
      {
        location: $location`The Copperhead Club`,
        target: $monster`Mob Penguin Capo`,
      },
    ).dress();
    withMacro(
      freeKill.macro instanceof Item
        ? Macro.item(freeKill.macro)
        : Macro.skill(freeKill.macro),
      () => {
        mapMonster($location`The Copperhead Club`, $monster`Mob Penguin Capo`);
        runCombat();
      },
      true,
    );
    freeKill = findFreeKill();
  }

  while (
    freeKill &&
    CombatLoversLocket.have() &&
    CombatLoversLocket.reminiscesLeft() > 1
  ) {
    const roboTarget = CombatLoversLocket.findMonster(
      (monster: Monster) => !BAD_CLL_MONSTERS.includes(monster),
      (monster: Monster) =>
        valueDrops(monster) +
        garboValue(Robortender.dropFrom(monster)) * Robortender.dropChance(),
    );

    if (!roboTarget) break;
    const regularTarget = CombatLoversLocket.findMonster(
      (monster: Monster) => !BAD_CLL_MONSTERS.includes(monster),
      valueDrops,
    );
    const familiar =
      regularTarget === roboTarget
        ? freeFightFamiliar(regularTarget, {
            canChooseMacro: roboTarget.attributes.includes("FREE"),
          })
        : $familiar`Robortender`;

    freeFightOutfit(
      roboTarget.attributes.includes("FREE")
        ? { familiar }
        : { ...freeKill.spec, familiar },
      roboTarget,
    ).dress();
    withMacro(
      isFree(roboTarget)
        ? Macro.basicCombat()
        : freeKill.macro instanceof Item
          ? Macro.item(freeKill.macro)
          : Macro.skill(freeKill.macro),
      () => CombatLoversLocket.reminisce(roboTarget),
      true,
    );
    freeKill = findFreeKill();
  }

  if (
    !Robortender.currentDrinks().includes($item`drive-by shooting`) &&
    availableAmount($item`fish head`) > currentHeads &&
    userConfirmDialog(
      "Garbo managed to rustle up a fish head, would you like it to use it to make a drive-by shooting so you can benefit from your robortender? Sorry for flip-flopping on this, life is hard.",
      true,
    )
  ) {
    if (!have($item`drive-by shooting`)) create($item`drive-by shooting`);
    Robortender.feed($item`drive-by shooting`);
    setBestLeprechaunAsMeatFamiliar();
  }
}

// Expected free fights, not including tentacles
export function estimatedFreeFights(): number {
  return (
    sum(freeFightSources, (source: FreeFight) => {
      const avail = source.available();
      return typeof avail === "number" ? avail : toInt(avail);
    }) +
    expectedFreeFightQuestFights() +
    expectedFreeGiantSandwormQuestFights()
  );
}

// Possible additional free fights from Eldritch Attunement
export function estimatedAttunementTentacles(): number {
  const totalFreeFights =
    sum(freeFightSources, (source: FreeFight) => {
      const avail = source.tentacle ? source.available() : 0;
      return typeof avail === "number" ? avail : toInt(avail);
    }) +
    possibleFreeFightQuestTentacleFights() +
    possibleFreeGiantSandwormQuestTentacleFights();
  return clamp(
    totalFreeFights,
    0,
    Math.max(
      0,
      11 - // Capped at 11,
        get("_eldritchTentaclesFoughtToday") - // minus what we've already fought,
        (get("questL02Larva") !== "unstarted" ? 1 : 0) - // minus one if we have access to Science Tent
        (have($skill`Evoke Eldritch Horror`) && !get("_eldritchHorrorEvoked") // minus one if we have Evoke Eldritch Horror
          ? 1
          : 0),
    ),
  );
}

function runShadowRiftTurn(): void {
  // we can probably have a better name
  if (get("encountersUntilSRChoice") === 0) return;
  if (
    willYachtzee() ||
    get("rufusQuestType") === "items" ||
    get("rufusQuestType") === "entity" // We can't handle bosses... yet
  ) {
    adv1(bestShadowRift(), -1, ""); // We shouldn't be using NC forcers
    return;
  }

  if (shouldClara("shadow waters")) {
    use($item`Clara's bell`);
  } else if (CinchoDeMayo.have() && CinchoDeMayo.totalAvailableCinch() >= 60) {
    const lastAcc = equippedItem($slot`acc3`);
    equip($slot`acc3`, $item`Cincho de Mayo`);
    while (CinchoDeMayo.currentCinch() < 60) {
      if (!freeRest()) throw new Error("We are out of free rests!");
    }
    useSkill($skill`Cincho: Fiesta Exit`);
    equip($slot`acc3`, lastAcc); // Re-equip last item
  } else if (
    have($item`Jurassic Parka`) &&
    get("_spikolodonSpikeUses") < 5 &&
    have($effect`Shadow Affinity`) &&
    get("encountersUntilSRChoice") >= 2
  ) {
    freeFightOutfit({ shirt: $item`Jurassic Parka` }, bestShadowRift()).dress();
    cliExecute("parka spikolodon");
    const macro = Macro.skill($skill`Launch spikolodon spikes`).basicCombat();
    garboAdventureAuto(bestShadowRift(), macro);
  } else {
    adv1(bestShadowRift(), -1, ""); // We wanted to use NC forcers, but none are suitable now
  }
}
