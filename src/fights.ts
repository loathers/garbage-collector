import {
  adv1,
  availableAmount,
  buy,
  cliExecute,
  closetAmount,
  equip,
  Familiar,
  getAutoAttack,
  getCampground,
  handlingChoice,
  inebrietyLimit,
  isBanished,
  Item,
  itemAmount,
  Location,
  mallPrice,
  maximize,
  Monster,
  myAscensions,
  myClass,
  myFamiliar,
  myInebriety,
  myLevel,
  myMaxhp,
  myPathId,
  numericModifier,
  outfit,
  print,
  putCloset,
  refreshStash,
  restoreHp,
  retrieveItem,
  runChoice,
  runCombat,
  setAutoAttack,
  setLocation,
  stashAmount,
  takeCloset,
  toInt,
  toItem,
  totalTurnsPlayed,
  toUrl,
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
  $locations,
  $monster,
  $monsters,
  $phyla,
  $phylum,
  $skill,
  $slot,
  ActionSource,
  adventureMacro,
  adventureMacroAuto,
  AsdonMartin,
  ChateauMantegna,
  clamp,
  Counter,
  CrystalBall,
  ensureEffect,
  get,
  have,
  maximizeCached,
  property,
  Requirement,
  set,
  SourceTerminal,
  tryFindFreeRun,
  TunnelOfLove,
  uneffect,
  Witchess,
} from "libram";
import { acquire } from "./acquire";
import { withStash } from "./clan";
import { Macro, withMacro } from "./combat";
import { freeFightFamiliar, meatFamiliar, pocketProfessorLectures } from "./familiar";
import {
  burnLibrams,
  embezzlerLog,
  expectedEmbezzlerProfit,
  globalOptions,
  HIGHLIGHT,
  kramcoGuaranteed,
  logMessage,
  ltbRun,
  mapMonster,
  propertyManager,
  questStep,
  resetDailyPreference,
  safeRestore,
  setChoice,
} from "./lib";
import { freeFightMood, meatMood } from "./mood";
import { freeFightOutfit, meatOutfit, tryFillLatte } from "./outfit";
import { bathroomFinance, potionSetup } from "./potions";
import {
  embezzlerCount,
  embezzlerMacro,
  embezzlerSources,
  estimatedTurns,
  getNextEmbezzlerFight,
} from "./embezzler";
import { canAdv } from "canadv.ash";
import { determineDraggableZoneAndEnsureAccess } from "./wanderer";
import postCombatActions from "./post";
import {
  crateStrategy,
  doingExtrovermectin,
  intializeExtrovermectinZones,
  saberCrateIfSafe,
} from "./extrovermectin";
import { magnifyingGlass } from "./dropsgear";
import { garboValue } from "./session";

const firstChainMacro = () =>
  Macro.if_(
    $monster`Knob Goblin Embezzler`,
    Macro.if_(
      "!hasskill Lecture on Relativity",
      Macro.externalIf(
        get("_sourceTerminalDigitizeMonster") !== $monster`Knob Goblin Embezzler`,
        Macro.tryCopier($skill`Digitize`)
      )
        .tryCopier($item`Spooky Putty sheet`)
        .tryCopier($item`Rain-Doh black box`)
        .tryCopier($item`4-d camera`)
        .tryCopier($item`unfinished ice sculpture`)
        .externalIf(get("_enamorangs") === 0, Macro.tryCopier($item`LOV Enamorang`))
    )
      .trySkill($skill`lecture on relativity`)
      .meatKill()
  ).abort();

const secondChainMacro = () =>
  Macro.if_(
    $monster`Knob Goblin Embezzler`,
    Macro.externalIf(
      myFamiliar() === $familiar`Pocket Professor`,
      Macro.if_("!hasskill Lecture on Relativity", Macro.trySkill($skill`Meteor Shower`))
        .if_(
          "!hasskill Lecture on Relativity",
          Macro.externalIf(
            get("_sourceTerminalDigitizeMonster") !== $monster`Knob Goblin Embezzler`,
            Macro.tryCopier($skill`Digitize`)
          )
            .tryCopier($item`Spooky Putty sheet`)
            .tryCopier($item`Rain-Doh black box`)
            .tryCopier($item`4-d camera`)
            .tryCopier($item`unfinished ice sculpture`)
            .externalIf(get("_enamorangs") === 0, Macro.tryCopier($item`LOV Enamorang`))
        )
        .trySkill($skill`lecture on relativity`)
    ).meatKill()
  ).abort();

function embezzlerSetup() {
  potionSetup(false);
  meatMood(true).execute(estimatedTurns());
  safeRestore();
  freeFightMood().execute(50);
  withStash($items`Platinum Yendorian Express Card, Bag o' Tricks`, () => {
    if (have($item`Platinum Yendorian Express Card`) && !get("expressCardUsed")) {
      maximize("MP", false);
      burnLibrams();
      use($item`Platinum Yendorian Express Card`);
    }
    if (have($item`Bag o' Tricks`) && !get("_bagOTricksUsed")) {
      use($item`Bag o' Tricks`);
    }
  });
  if (have($item`License to Chill`) && !get("_licenseToChillUsed")) {
    maximize("MP", false);
    burnLibrams();
    use($item`License to Chill`);
  }
  burnLibrams(400);
  if (
    globalOptions.ascending &&
    questStep("questM16Temple") > 0 &&
    get("lastTempleAdventures") < myAscensions() &&
    acquire(1, $item`stone wool`, 3 * get("valueOfAdventure") + 100, false) > 0
  ) {
    ensureEffect($effect`Stone-Faced`);
    setChoice(582, 1);
    setChoice(579, 3);
    while (get("lastTempleAdventures") < myAscensions()) {
      const run = tryFindFreeRun() ?? ltbRun();
      if (!run) break;
      useFamiliar(run.constraints.familiar?.() ?? freeFightFamiliar());
      run.constraints.preparation?.();
      freeFightOutfit(run.constraints.equipmentRequirements?.());
      adventureMacro($location`The Hidden Temple`, run.macro);
    }
  }

  bathroomFinance(embezzlerCount());

  if (SourceTerminal.have()) SourceTerminal.educate([$skill`Extract`, $skill`Digitize`]);
  if (
    !get("_cameraUsed") &&
    !have($item`shaking 4-d camera`) &&
    expectedEmbezzlerProfit() > mallPrice($item`4-d camera`)
  ) {
    property.withProperty("autoSatisfyWithCloset", true, () => retrieveItem($item`4-d camera`));
  }

  if (
    !get("_iceSculptureUsed") &&
    !have($item`ice sculpture`) &&
    expectedEmbezzlerProfit() > (mallPrice($item`snow berries`) + mallPrice($item`ice harvest`)) * 3
  ) {
    property.withProperty("autoSatisfyWithCloset", true, () => {
      cliExecute("refresh inventory");
      retrieveItem($item`unfinished ice sculpture`);
    });
  }

  if (
    !get("_enamorangs") &&
    !itemAmount($item`LOV Enamorang`) &&
    expectedEmbezzlerProfit() > 20000
  ) {
    retrieveItem($item`LOV Enamorang`);
  }

  // Fix invalid copiers (caused by ascending or combat text-effects)
  if (have($item`Spooky Putty monster`) && !get("spookyPuttyMonster")) {
    // Visit the description to update the monster as it may be valid but not tracked correctly
    visitUrl(`desc_item.php?whichitem=${$item`Spooky Putty monster`.descid}`, false, false);
    if (!get("spookyPuttyMonster")) {
      // Still invalid, use it to turn back into the spooky putty sheet
      use($item`Spooky Putty monster`);
    }
  }

  if (have($item`Rain-Doh box full of monster`) && !get("rainDohMonster")) {
    visitUrl(`desc_item.php?whichitem=${$item`Rain-Doh box full of monster`.descid}`, false, false);
  }

  if (have($item`shaking 4-d camera`) && !get("cameraMonster")) {
    visitUrl(`desc_item.php?whichitem=${$item`shaking 4-d camera`.descid}`, false, false);
  }

  if (have($item`envyfish egg`) && !get("envyfishMonster")) {
    visitUrl(`desc_item.php?whichitem=${$item`envyfish egg`.descid}`, false, false);
  }

  if (have($item`ice sculpture`) && !get("iceSculptureMonster")) {
    visitUrl(`desc_item.php?whichitem=${$item`ice sculpture`.descid}`, false, false);
  }

  if (doingExtrovermectin()) {
    intializeExtrovermectinZones();
  }
}

function startWandererCounter() {
  const nextFight = getNextEmbezzlerFight();
  if (!nextFight || nextFight.canInitializeWandererCounters || nextFight.draggable) {
    return;
  }
  const digitizeNeedsStarting =
    Counter.get("Digitize Monster") === null && get("_sourceTerminalDigitizeUses") !== 0;
  const romanceNeedsStarting =
    get("_romanticFightsLeft") > 0 &&
    Counter.get("Romantic Monster window begin") === null &&
    Counter.get("Romantic Monster window end") === null;
  if (digitizeNeedsStarting || romanceNeedsStarting) {
    if (digitizeNeedsStarting) print("Starting digitize counter by visiting the Haunted Kitchen!");
    if (romanceNeedsStarting) print("Starting romance counter by visiting the Haunted Kitchen!");
    do {
      let run: ActionSource;
      if (get("beGregariousFightsLeft") > 0) {
        print("You still have gregs active, so we're going to wear your meat outfit.");
        run = ltbRun();
        run.constraints.preparation?.();
        useFamiliar(meatFamiliar());
        meatOutfit(true);
      } else {
        print("You do not have gregs active, so this is a regular free run.");
        run = tryFindFreeRun() ?? ltbRun();
        useFamiliar(run.constraints.familiar?.() ?? freeFightFamiliar());
        run.constraints.preparation?.();
        freeFightOutfit(run.constraints.equipmentRequirements?.());
      }
      adventureMacro(
        $location`The Haunted Kitchen`,
        Macro.if_($monster`Knob Goblin Embezzler`, embezzlerMacro()).step(run.macro)
      );
    } while (
      get("lastCopyableMonster") === $monster`Government agent` ||
      ["Lights Out in the Kitchen", "Play Misty For Me", "Wooof! Wooooooof!"].includes(
        get("lastEncounter")
      )
      // We use the haunted kitchen because we don't do anything else there, it's always available, it's 100% combat, and it allows wanderers
      // Account for lights out and semi-rare
      // It sucks to hit the semi-rare, but SRs interact weirdly with wanderers, and it's better to know than not to know
    );
  }
}

const witchessPieces = [
  { piece: $monster`Witchess Bishop`, drop: $item`Sacramento wine` },
  { piece: $monster`Witchess Knight`, drop: $item`jumping horseradish` },
  { piece: $monster`Witchess Pawn`, drop: $item`armored prawn` },
  { piece: $monster`Witchess Rook`, drop: $item`Greek fire` },
];

function bestWitchessPiece() {
  return witchessPieces.sort((a, b) => garboValue(b.drop) - garboValue(a.drop))[0].piece;
}

export function dailyFights(): void {
  if (myInebriety() > inebrietyLimit()) return;
  if (embezzlerSources.some((source) => source.potential())) {
    withStash($items`Spooky Putty sheet`, () => {
      // check if user wants to wish for embezzler before doing setup
      if (!getNextEmbezzlerFight()) return;
      embezzlerSetup();

      // PROFESSOR COPIES
      if (have($familiar`Pocket Professor`)) {
        const potentialPocketProfessorLectures = [
          {
            property: "_garbo_meatChain",
            maximizeParameters: [], // implicitly maximize against meat
            macro: firstChainMacro(),
            goalMaximize: (requirements: Requirement) => meatOutfit(true, requirements),
          },
          {
            property: "_garbo_weightChain",
            maximizeParameters: ["Familiar Weight"],
            macro: secondChainMacro(),
            goalMaximize: (requirements: Requirement) =>
              maximizeCached(requirements.maximizeParameters, requirements.maximizeOptions),
          },
        ];

        for (const potentialLecture of potentialPocketProfessorLectures) {
          const { property, maximizeParameters, macro, goalMaximize } = potentialLecture;
          const fightSource = getNextEmbezzlerFight();
          if (!fightSource) return;
          if (get(property, false)) continue;

          if (fightSource.gregariousReplace) {
            const crateIsSabered = get("_saberForceMonster") === $monster`crate`;
            const notEnoughCratesSabered = get("_saberForceMonsterCount") < 2;
            const weWantToSaberCrates = !crateIsSabered || notEnoughCratesSabered;
            if (weWantToSaberCrates) saberCrateIfSafe();
          }

          useFamiliar($familiar`Pocket Professor`);
          goalMaximize(
            Requirement.merge([
              new Requirement(maximizeParameters, {
                forceEquip: $items`Pocket Professor memory chip`,
              }),
              ...fightSource.requirements,
            ])
          );

          if (get("_pocketProfessorLectures") < pocketProfessorLectures()) {
            const startLectures = get("_pocketProfessorLectures");
            fightSource.run({
              macro: macro,
            });
            embezzlerLog.initialEmbezzlersFought +=
              1 + get("_pocketProfessorLectures") - startLectures;
            embezzlerLog.sources.push(fightSource.name);
            embezzlerLog.sources.push(
              ...new Array<string>(get("_pocketProfessorLectures") - startLectures).fill(
                "Pocket Professor"
              )
            );
          }
          set(property, true);
          postCombatActions();
          startWandererCounter();
        }
      }

      // REMAINING EMBEZZLER FIGHTS
      let nextFight = getNextEmbezzlerFight();
      while (nextFight !== null) {
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

        const underwater = nextFight.location().environment === "underwater";

        const romanticFamiliar = $familiars`Obtuse Angel, Reanimated Reanimator`.find(have);
        if (
          romanticFamiliar &&
          get("_badlyRomanticArrows") === 0 &&
          nextFight.draggable &&
          !underwater
        ) {
          useFamiliar(romanticFamiliar);
        } else {
          useFamiliar(meatFamiliar());
        }

        setLocation(nextFight.location());
        meatOutfit(true, Requirement.merge(nextFight.requirements), underwater);

        nextFight.run();
        postCombatActions();

        print(`Finished ${nextFight.name}`);
        if (
          totalTurnsPlayed() - startTurns === 1 &&
          get("lastCopyableMonster") === $monster`Knob Goblin Embezzler` &&
          (nextFight.wrongEncounterName || get("lastEncounter") === "Knob Goblin Embezzler")
        ) {
          if (nextFight.wrongEncounterName) {
            print(`fight ${nextFight.name} reports wrong encounter!`);
          }
          embezzlerLog.initialEmbezzlersFought++;
          embezzlerLog.sources.push(nextFight.name);
        }

        nextFight = getNextEmbezzlerFight();

        // try to deliver the thesis
        const romanticMonsterImpossible =
          Counter.get("Romantic Monster Window end") === null ||
          (Counter.get("Romantic Monster Window begin") ?? -1) > 0 ||
          get("_romanticFightsLeft") <= 0;
        if (romanticMonsterImpossible && (!nextFight || !nextFight.draggable)) {
          doSausage();
          // Check in case our prof gained enough exp during the profchains
          if (
            thesisReady() &&
            get("beGregariousFightsLeft") <= 0 &&
            nextFight?.name !== "Orb Prediction"
          ) {
            deliverThesis();
          }
        }
        startWandererCounter();
      }
    });
  }
}

type FreeFightOptions = {
  cost?: () => number;
  familiar?: () => Familiar | null;
  requirements?: () => Requirement[];
  noncombat?: () => boolean;
};

let bestNonCheerleaderFairy: Familiar;

function bestFairy() {
  if (have($familiar`Trick-or-Treating Tot`) && have($item`li'l ninja costume`)) {
    return $familiar`Trick-or-Treating Tot`;
  }
  if (get("_cheerleaderSteam") > 100 && have($familiar`Steam-Powered Cheerleader`)) {
    return $familiar`Steam-Powered Cheerleader`;
  }

  if (!bestNonCheerleaderFairy) {
    setLocation($location`Noob Cave`);
    const bestNonCheerleaderFairies = Familiar.all()
      .filter((familiar) => have(familiar) && familiar !== $familiar`Steam-Powered Cheerleader`)
      .sort(
        (a, b) =>
          numericModifier(b, "Fairy", 1, $item`none`) - numericModifier(a, "Fairy", 1, $item`none`)
      );
    const bestFairyMult = numericModifier(bestNonCheerleaderFairies[0], "Fairy", 1, $item`none`);
    bestNonCheerleaderFairy = bestNonCheerleaderFairies
      .filter((fairy) => numericModifier(fairy, "Fairy", 1, $item`none`) === bestFairyMult)
      .sort(
        (a, b) =>
          numericModifier(b, "Leprechaun", 1, $item`none`) -
          numericModifier(a, "Leprechaun", 1, $item`none`)
      )[0];
  }
  return bestNonCheerleaderFairy;
}

class FreeFight {
  available: () => number | boolean;
  run: () => void;
  options: FreeFightOptions;

  constructor(available: () => number | boolean, run: () => void, options: FreeFightOptions = {}) {
    this.available = available;
    this.run = run;
    this.options = options;
  }

  runAll() {
    if (!this.available()) return;
    if ((this.options.cost ? this.options.cost() : 0) > get("garbo_valueOfFreeFight", 2000)) return;
    while (this.available()) {
      voidMonster();
      const noncombat = !!this.options?.noncombat?.();
      if (!noncombat) {
        useFamiliar(
          this.options.familiar
            ? this.options.familiar() ?? freeFightFamiliar()
            : freeFightFamiliar()
        );
      }
      freeFightMood().execute();
      freeFightOutfit(
        this.options.requirements ? Requirement.merge(this.options.requirements()) : undefined
      );
      safeRestore();
      withMacro(Macro.basicCombat(), this.run);
      postCombatActions();
      // Slot in our Professor Thesis if it's become available
      if (thesisReady() && !have($effect`Feeling Lost`)) deliverThesis();
    }
  }
}

class FreeRunFight extends FreeFight {
  freeRun: (runSource: ActionSource) => void;

  constructor(
    available: () => number | boolean,
    run: (runSource: ActionSource) => void,
    options: FreeFightOptions = {}
  ) {
    super(available, () => null, options);
    this.freeRun = run;
  }

  runAll() {
    if (!this.available()) return;
    if ((this.options.cost ? this.options.cost() : 0) > get("garbo_valueOfFreeFight", 2000)) return;
    while (this.available()) {
      const runSource = tryFindFreeRun({ noFamiliar: () => this.options.familiar !== undefined });
      if (!runSource) break;
      useFamiliar(
        runSource.constraints.familiar?.() ?? this.options.familiar?.() ?? freeFightFamiliar()
      );
      runSource.constraints.preparation?.();
      freeFightOutfit(
        Requirement.merge([
          ...(this.options.requirements ? this.options.requirements() : []),
          ...(runSource.constraints.equipmentRequirements
            ? [runSource.constraints.equipmentRequirements()]
            : []),
        ])
      );
      safeRestore();
      withMacro(Macro.step(runSource.macro), () => this.freeRun(runSource));
      postCombatActions();
    }
  }
}

const pygmyMacro = Macro.if_(
  $monster`pygmy bowler`,
  Macro.trySkill($skill`Snokebomb`).item($item`Louder Than Bomb`)
)
  .if_(
    $monster`pygmy orderlies`,
    Macro.trySkill($skill`Feel Hatred`).item($item`divine champagne popper`)
  )
  .if_($monster`pygmy janitor`, Macro.item($item`tennis ball`))
  .if_($monster`time-spinner prank`, Macro.basicCombat())
  .if_($monster`drunk pygmy`, Macro.trySkill($skill`Extract`).trySkill($skill`Sing Along`))
  .abort();

function getStenchLocation() {
  return (
    $locations`Barf Mountain, The Hippy Camp (Bombed Back to the Stone Age), The Dark and Spooky Swamp`.find(
      (l) => canAdv(l, false)
    ) || $location`none`
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
      get("hiddenTavernUnlock") === myAscensions() || mallPrice($item`Bowl of Scorpions`) < 1000
    );
  }
}

const freeFightSources = [
  new FreeFight(
    () => TunnelOfLove.have() && !TunnelOfLove.isUsed(),
    () => {
      TunnelOfLove.fightAll(
        "LOV Epaulettes",
        "Open Heart Surgery",
        "LOV Extraterrestrial Chocolate"
      );

      visitUrl("choice.php");
      if (handlingChoice()) throw "Did not get all the way through LOV.";
    }
  ),

  new FreeFight(
    () =>
      ChateauMantegna.have() &&
      !ChateauMantegna.paintingFought() &&
      (ChateauMantegna.paintingMonster()?.attributes?.includes("FREE") ?? false),
    () => ChateauMantegna.fightPainting(),
    {
      familiar: () =>
        have($familiar`Robortender`) &&
        $phyla`elf, fish, hobo, penguin, constellation`.some(
          (phylum) => phylum === ChateauMantegna.paintingMonster()?.phylum
        )
          ? $familiar`Robortender`
          : null,
    }
  ),

  new FreeFight(
    () => get("questL02Larva") !== "unstarted" && !get("_eldritchTentacleFought"),
    () => {
      const haveEldritchEssence = itemAmount($item`eldritch essence`) !== 0;
      visitUrl("place.php?whichplace=forestvillage&action=fv_scientist", false);
      if (!handlingChoice()) throw "No choice?";
      runChoice(haveEldritchEssence ? 2 : 1);
    }
  ),

  new FreeFight(
    () => have($skill`Evoke Eldritch Horror`) && !get("_eldritchHorrorEvoked"),
    () => useSkill($skill`Evoke Eldritch Horror`)
  ),

  new FreeFight(
    () => clamp(3 - get("_lynyrdSnareUses"), 0, 3),
    () => use($item`lynyrd snare`),
    {
      cost: () => mallPrice($item`lynyrd snare`),
    }
  ),

  new FreeFight(
    () =>
      have($item`[glitch season reward name]`) &&
      !get("_glitchMonsterFights") &&
      get("garbo_fightGlitch", false),
    () =>
      withMacro(
        Macro.trySkill($skill`Curse of Marinara`)
          .trySkill($skill`Conspiratorial Whispers`)
          .trySkill($skill`Shadow Noodles`)
          .externalIf(
            get("glitchItemImplementationCount") * itemAmount($item`[glitch season reward name]`) >=
              2000,
            Macro.item([$item`gas can`, $item`gas can`])
          )
          .externalIf(
            get("lovebugsUnlocked"),
            Macro.trySkill($skill`Summon Love Gnats`).trySkill($skill`Summon Love Mosquito`)
          )
          .trySkill($skill`Micrometeorite`)
          .tryItem($item`Time-Spinner`)
          .tryItem($item`little red book`)
          .tryItem($item`Rain-Doh blue balls`)
          .tryItem($item`Rain-Doh indigo cup`)
          .trySkill($skill`Entangling Noodles`)
          .trySkill($skill`Frost Bite`)
          .kill(),
        () => {
          restoreHp(myMaxhp());
          if (have($skill`Ruthless Efficiency`)) ensureEffect($effect`Ruthlessly Efficient`);
          if (have($skill`Mathematical Precision`)) ensureEffect($effect`Mathematically Precise`);
          if (have($skill`Blood Bubble`)) ensureEffect($effect`Blood Bubble`);
          retrieveItem($item`[glitch season reward name]`);
          if (get("glitchItemImplementationCount") >= 1000) retrieveItem($item`gas can`, 2);
          visitUrl("inv_eat.php?pwd&whichitem=10207");
          runCombat();
        }
      ),
    {
      requirements: () => [new Requirement(["1000 mainstat"], {})],
    }
  ),

  // 6	10	0	0	Infernal Seals	variety of items; must be Seal Clubber for 5, must also have Claw of the Infernal Seal in inventory for 10.
  new FreeFight(
    () => {
      const maxSeals = retrieveItem(1, $item`Claw of the Infernal Seal`) ? 10 : 5;
      const maxSealsAvailable =
        get("lastGuildStoreOpen") === myAscensions()
          ? maxSeals
          : Math.min(maxSeals, Math.floor(availableAmount($item`seal-blubber candle`) / 3));
      return myClass() === $class`Seal Clubber`
        ? Math.max(maxSealsAvailable - get("_sealsSummoned"), 0)
        : 0;
    },
    () => {
      const figurine =
        get("lastGuildStoreOpen") === myAscensions()
          ? $item`figurine of a wretched-looking seal`
          : $item`figurine of an ancient seal`;
      retrieveItem(1, figurine);
      retrieveItem(
        get("lastGuildStoreOpen") === myAscensions() ? 1 : 3,
        $item`seal-blubber candle`
      );
      withMacro(
        Macro.startCombat()
          .trySkill($skill`Furious Wallop`)
          .while_("hasskill Lunging Thrust-Smack", Macro.skill($skill`Lunging Thrust-Smack`))
          .while_("hasskill Thrust-Smack", Macro.skill($skill`Thrust-Smack`))
          .while_("hasskill Lunge Smack", Macro.skill($skill`Lunge Smack`))
          .attack()
          .repeat(),
        () => use(figurine)
      );
    },
    {
      requirements: () => [new Requirement(["Club"], {})],
    }
  ),

  new FreeFight(
    () => clamp(10 - get("_brickoFights"), 0, 10),
    () => use($item`BRICKO ooze`),
    {
      cost: () => mallPrice($item`BRICKO eye brick`) + 2 * mallPrice($item`BRICKO brick`),
    }
  ),

  new FreeFight(
    () => (wantPills() ? 5 - get("_saberForceUses") : 0),
    () => {
      ensureEffect($effect`Transpondent`);
      if (have($familiar`Red-Nosed Snapper`)) cliExecute(`snapper ${$phylum`dude`}`);
      setChoice(1387, 3);
      if (
        have($skill`Comprehensive Cartography`) &&
        get("_monstersMapped") <
          (getBestItemStealZone() && get("_fireExtinguisherCharge") >= 10 ? 2 : 3) // Save a map to use for polar vortex
      ) {
        withMacro(
          Macro.if_($monster`time-spinner prank`, Macro.kill()).skill($skill`Use the Force`),
          () => {
            mapMonster($location`Domed City of Grimacia`, $monster`grizzled survivor`);
            runCombat();
            runChoice(-1);
          }
        );
      } else {
        if (numericModifier($item`Grimacite guayabera`, "Monster Level") < 40) {
          retrieveItem(1, $item`tennis ball`);
          retrieveItem(1, $item`Louder Than Bomb`);
          retrieveItem(1, $item`divine champagne popper`);
        }
        adventureMacro(
          $location`Domed City of Grimacia`,
          Macro.if_(
            $monster`alielf`,
            Macro.trySkill($skill`Asdon Martin: Spring-Loaded Front Bumper`).tryItem(
              $item`Louder Than Bomb`
            )
          )
            .if_($monster`cat-alien`, Macro.trySkill($skill`Snokebomb`).tryItem($item`tennis ball`))
            .if_(
              $monster`dog-alien`,
              Macro.trySkill($skill`Feel Hatred`).tryItem($item`divine champagne popper`)
            )
            .if_($monster`time-spinner prank`, Macro.kill())
            .skill($skill`Use the Force`)
        );
      }
    },
    {
      requirements: () => [
        new Requirement([], { forceEquip: $items`Fourth of May Cosplay Saber` }),
      ],
      familiar: () => (have($familiar`Red-Nosed Snapper`) ? $familiar`Red-Nosed Snapper` : null),
    }
  ),

  // Initial 9 Pygmy fights
  new FreeFight(
    () =>
      get("questL11Worship") !== "unstarted" && bowlOfScorpionsAvailable()
        ? clamp(9 - get("_drunkPygmyBanishes"), 0, 9)
        : 0,
    () => {
      putCloset(itemAmount($item`bowling ball`), $item`bowling ball`);
      retrieveItem(clamp(9 - get("_drunkPygmyBanishes"), 0, 9), $item`Bowl of Scorpions`);
      retrieveItem($item`Louder Than Bomb`);
      retrieveItem($item`tennis ball`);
      retrieveItem($item`divine champagne popper`);
      adventureMacro($location`The Hidden Bowling Alley`, pygmyMacro);
    },
    {
      requirements: () => [
        new Requirement([], {
          preventEquip: $items`Staff of Queso Escusado, stinky cheese sword`,
          bonusEquip: new Map([[$item`garbage sticker`, 100], ...magnifyingGlass()]),
        }),
      ],
    }
  ),

  // 10th Pygmy fight. If we have an orb, equip it for this fight, to save for later
  new FreeFight(
    () => get("questL11Worship") !== "unstarted" && get("_drunkPygmyBanishes") === 9,
    () => {
      putCloset(itemAmount($item`bowling ball`), $item`bowling ball`);
      retrieveItem($item`Bowl of Scorpions`);
      adventureMacro($location`The Hidden Bowling Alley`, pygmyMacro);
    },
    {
      requirements: () => [
        new Requirement([], {
          forceEquip: $items`miniature crystal ball`.filter((item) => have(item)),
          preventEquip: $items`Staff of Queso Escusado, stinky cheese sword`,
          bonusEquip: new Map([[$item`garbage sticker`, 100], ...magnifyingGlass()]),
        }),
      ],
    }
  ),
  // 11th pygmy fight if we lack a saber
  new FreeFight(
    () =>
      get("questL11Worship") !== "unstarted" &&
      get("_drunkPygmyBanishes") === 10 &&
      (!have($item`Fourth of May Cosplay Saber`) || crateStrategy() === "Saber"),
    () => {
      putCloset(itemAmount($item`bowling ball`), $item`bowling ball`);
      retrieveItem($item`Bowl of Scorpions`);
      adventureMacroAuto($location`The Hidden Bowling Alley`, pygmyMacro);
    },
    {
      requirements: () => [
        new Requirement([], {
          preventEquip: $items`Staff of Queso Escusado, stinky cheese sword`,
          bonusEquip: new Map([[$item`garbage sticker`, 100], ...magnifyingGlass()]),
        }),
      ],
    }
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
        $monsters`pygmy orderlies, pygmy bowler, pygmy janitor`.includes(saberedMonster);
      const drunksCanAppear =
        get("_drunkPygmyBanishes") === 10 ||
        (saberedMonster === $monster`drunk pygmy` && get("_saberForceMonsterCount"));
      const remainingSaberPygmies =
        (saberedMonster === $monster`drunk pygmy` ? get("_saberForceMonsterCount") : 0) +
        2 * clamp(5 - get("_saberForceUses"), 0, 5);
      return (
        get("questL11Worship") !== "unstarted" &&
        rightTime &&
        !wrongPygmySabered &&
        drunksCanAppear &&
        remainingSaberPygmies
      );
    },
    () => {
      if (
        (get("_saberForceMonster") !== $monster`drunk pygmy` ||
          get("_saberForceMonsterCount") === 1) &&
        get("_saberForceUses") < 5
      ) {
        putCloset(itemAmount($item`bowling ball`), $item`bowling ball`);
        putCloset(itemAmount($item`Bowl of Scorpions`), $item`Bowl of Scorpions`);
        adventureMacro($location`The Hidden Bowling Alley`, Macro.skill($skill`Use the Force`));
      } else {
        if (closetAmount($item`Bowl of Scorpions`) > 0) {
          takeCloset(closetAmount($item`Bowl of Scorpions`), $item`Bowl of Scorpions`);
        } else retrieveItem($item`Bowl of Scorpions`);
        adventureMacro($location`The Hidden Bowling Alley`, pygmyMacro);
      }
    },
    {
      requirements: () => [
        new Requirement([], {
          forceEquip: $items`Fourth of May Cosplay Saber`,
          bonusEquip: new Map([[$item`garbage sticker`, 100], ...magnifyingGlass()]),
          preventEquip: $items`Staff of Queso Escusado, stinky cheese sword`,
        }),
      ],
    }
  ),

  // Finally, saber or not, if we have a drunk pygmy in our crystal ball, let it out.
  new FreeFight(
    () =>
      get("questL11Worship") !== "unstarted" &&
      CrystalBall.currentPredictions(false).get($location`The Hidden Bowling Alley`) ===
        $monster`drunk pygmy` &&
      get("_drunkPygmyBanishes") >= 11,
    () => {
      putCloset(itemAmount($item`bowling ball`), $item`bowling ball`);
      retrieveItem(1, $item`Bowl of Scorpions`);
      adventureMacro(
        $location`The Hidden Bowling Alley`,
        Macro.if_($monster`drunk pygmy`, pygmyMacro).abort()
      );
    },
    {
      requirements: () => [
        new Requirement([], {
          forceEquip: $items`miniature crystal ball`.filter((item) => have(item)),
          bonusEquip: new Map([[$item`garbage sticker`, 100], ...magnifyingGlass()]),
          preventEquip: $items`Staff of Queso Escusado, stinky cheese sword`,
        }),
      ],
    }
  ),

  new FreeFight(
    () =>
      have($item`Time-Spinner`) &&
      !doingExtrovermectin() &&
      $location`The Hidden Bowling Alley`.combatQueue.includes("drunk pygmy") &&
      get("_timeSpinnerMinutesUsed") < 8,
    () => {
      retrieveItem($item`Bowl of Scorpions`);
      Macro.trySkill($skill`Extract`)
        .trySkill($skill`Sing Along`)
        .setAutoAttack();
      visitUrl(`inv_use.php?whichitem=${toInt($item`Time-Spinner`)}`);
      runChoice(1);
      visitUrl(`choice.php?whichchoice=1196&monid=${$monster`drunk pygmy`.id}&option=1`);
    },
    {
      requirements: () => [
        new Requirement([], {
          bonusEquip: new Map([[$item`garbage sticker`, 100], ...magnifyingGlass()]),
          preventEquip: $items`Staff of Queso Escusado, stinky cheese sword`,
        }),
      ],
    }
  ),

  new FreeFight(
    () => get("_sausageFights") === 0 && have($item`Kramco Sausage-o-Matic™`),
    () => adv1(determineDraggableZoneAndEnsureAccess(), -1, ""),
    {
      requirements: () => [
        new Requirement([], {
          forceEquip: $items`Kramco Sausage-o-Matic™`,
        }),
      ],
    }
  ),

  new FreeFight(
    () =>
      get("questL11Ron") === "finished"
        ? clamp(5 - get("_glarkCableUses"), 0, itemAmount($item`glark cable`))
        : 0,
    () => {
      adventureMacro($location`The Red Zeppelin`, Macro.item($item`glark cable`));
    }
  ),

  // Mushroom garden
  new FreeFight(
    () =>
      (have($item`packet of mushroom spores`) ||
        getCampground()["packet of mushroom spores"] !== undefined) &&
      get("_mushroomGardenFights") === 0,
    () => {
      if (have($item`packet of mushroom spores`)) use($item`packet of mushroom spores`);
      if (SourceTerminal.have()) {
        SourceTerminal.educate([$skill`Extract`, $skill`Portscan`]);
      }
      adventureMacro(
        $location`Your Mushroom Garden`,
        Macro.externalIf(
          !doingExtrovermectin(),
          Macro.if_($skill`Macrometeorite`, Macro.trySkill($skill`Portscan`))
        ).basicCombat()
      );
      if (have($item`packet of tall grass seeds`)) use($item`packet of tall grass seeds`);
    },
    {
      familiar: () => (have($familiar`Robortender`) ? $familiar`Robortender` : null),
    }
  ),

  // Portscan and mushroom garden
  new FreeFight(
    () =>
      !doingExtrovermectin() &&
      (have($item`packet of mushroom spores`) ||
        getCampground()["packet of mushroom spores"] !== undefined) &&
      Counter.get("portscan.edu") === 0 &&
      have($skill`Macrometeorite`) &&
      get("_macrometeoriteUses") < 10,
    () => {
      if (have($item`packet of mushroom spores`)) use($item`packet of mushroom spores`);
      if (SourceTerminal.have()) {
        SourceTerminal.educate([$skill`Extract`, $skill`Portscan`]);
      }
      adventureMacro(
        $location`Your Mushroom Garden`,
        Macro.if_($monster`Government agent`, Macro.skill($skill`Macrometeorite`)).if_(
          $monster`piranha plant`,
          Macro.if_($skill`Macrometeorite`, Macro.trySkill($skill`Portscan`)).basicCombat()
        )
      );
      if (have($item`packet of tall grass seeds`)) use($item`packet of tall grass seeds`);
    }
  ),

  new FreeFight(
    () => (have($familiar`God Lobster`) ? clamp(3 - get("_godLobsterFights"), 0, 3) : 0),
    () => {
      propertyManager.setChoices({
        1310: !have($item`God Lobster's Crown`) ? 1 : 2, // god lob equipment, then stats
      });
      restoreHp(myMaxhp());
      visitUrl("main.php?fightgodlobster=1");
      runCombat();
      visitUrl("choice.php");
      if (handlingChoice()) runChoice(-1);
    },
    {
      familiar: () => $familiar`God Lobster`,
      requirements: () => [
        new Requirement([], {
          bonusEquip: new Map<Item, number>([
            [$item`God Lobster's Scepter`, 1000],
            [$item`God Lobster's Ring`, 2000],
            [$item`God Lobster's Rod`, 3000],
            [$item`God Lobster's Robe`, 4000],
            [$item`God Lobster's Crown`, 5000],
          ]),
        }),
      ],
    }
  ),

  new FreeFight(
    () => (have($familiar`Machine Elf`) ? clamp(5 - get("_machineTunnelsAdv"), 0, 5) : 0),
    () => {
      propertyManager.setChoices({
        1119: 6, // escape DMT
      });
      const thought =
        garboValue($item`abstraction: certainty`) >= garboValue($item`abstraction: thought`);
      const action = garboValue($item`abstraction: joy`) >= garboValue($item`abstraction: action`);
      const sensation =
        garboValue($item`abstraction: motion`) >= garboValue($item`abstraction: sensation`);

      if (thought) {
        acquire(1, $item`abstraction: thought`, garboValue($item`abstraction: certainty`), false);
      }
      if (action) {
        acquire(1, $item`abstraction: action`, garboValue($item`abstraction: joy`), false);
      }
      if (sensation) {
        acquire(1, $item`abstraction: sensation`, garboValue($item`abstraction: motion`), false);
      }
      adventureMacro(
        $location`The Deep Machine Tunnels`,
        Macro.externalIf(
          thought,
          Macro.if_($monster`Perceiver of Sensations`, Macro.tryItem($item`abstraction: thought`))
        )
          .externalIf(
            action,
            Macro.if_($monster`Thinker of Thoughts`, Macro.tryItem($item`abstraction: action`))
          )
          .externalIf(
            sensation,
            Macro.if_($monster`Performer of Actions`, Macro.tryItem($item`abstraction: sensation`))
          )
          .basicCombat()
      );
    },
    {
      familiar: () => $familiar`Machine Elf`,
    }
  ),

  // 28	5	0	0	Witchess pieces	must have a Witchess Set; can copy for more
  new FreeFight(
    () => (Witchess.have() ? clamp(5 - Witchess.fightsDone(), 0, 5) : 0),
    () => Witchess.fightPiece(bestWitchessPiece())
  ),

  new FreeFight(
    () => get("snojoAvailable") && clamp(10 - get("_snojoFreeFights"), 0, 10),
    () => {
      if (get("snojoSetting") === null) {
        visitUrl("place.php?whichplace=snojo&action=snojo_controller");
        runChoice(3);
      }
      adv1($location`The X-32-F Combat Training Snowman`, -1, "");
    }
  ),

  new FreeFight(
    () =>
      get("neverendingPartyAlways") && questStep("_questPartyFair") < 999
        ? clamp(10 - get("_neverendingPartyFreeTurns"), 0, 10)
        : 0,
    () => {
      setNepQuestChoicesAndPrepItems();
      adventureMacro(
        $location`The Neverending Party`,
        Macro.trySkill($skill`Feel Pride`).basicCombat()
      );
    },
    {
      requirements: () => [
        new Requirement(
          [
            ...(get("_questPartyFairQuest") === "trash" ? ["100 Item Drop"] : []),
            ...(get("_questPartyFairQuest") === "dj" ? ["100 Meat Drop"] : []),
          ],
          {
            forceEquip: [
              ...(have($item`January's Garbage Tote`) ? $items`makeshift garbage shirt` : []),
            ],
          }
        ),
      ],
    }
  ),

  // Get a li'l ninja costume for 150% item drop
  new FreeFight(
    () =>
      !have($item`li'l ninja costume`) &&
      have($familiar`Trick-or-Treating Tot`) &&
      !get("_firedJokestersGun") &&
      have($item`The Jokester's gun`) &&
      questStep("questL08Trapper") >= 2,
    () =>
      adventureMacro(
        $location`Lair of the Ninja Snowmen`,
        Macro.skill($skill`Fire the Jokester's Gun`).abort()
      ),
    {
      requirements: () => [new Requirement([], { forceEquip: $items`The Jokester's gun` })],
    }
  ),

  // Fallback for li'l ninja costume if Lair of the Ninja Snowmen is unavailable
  new FreeFight(
    () =>
      !have($item`li'l ninja costume`) &&
      have($familiar`Trick-or-Treating Tot`) &&
      !get("_firedJokestersGun") &&
      have($item`The Jokester's gun`) &&
      have($skill`Comprehensive Cartography`) &&
      get("_monstersMapped") < 3,
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
    {
      requirements: () => [new Requirement([], { forceEquip: $items`The Jokester's gun` })],
    }
  ),
];

const freeRunFightSources = [
  // Unlock Latte ingredients
  new FreeRunFight(
    () =>
      have($item`latte lovers member's mug`) &&
      !get("latteUnlocks").includes("cajun") &&
      questStep("questL11MacGuffin") > -1,
    (runSource: ActionSource) => {
      propertyManager.setChoices({
        [923]: 1, // go to the blackberries in All Around the Map
        [924]: 1, // fight a blackberry bush, so that we can freerun
      });
      adventureMacro($location`The Black Forest`, runSource.macro);
    },
    {
      requirements: () => [new Requirement([], { forceEquip: $items`latte lovers member's mug` })],
    }
  ),
  new FreeRunFight(
    () =>
      have($item`latte lovers member's mug`) &&
      !get("latteUnlocks").includes("rawhide") &&
      questStep("questL02Larva") > -1,
    (runSource: ActionSource) => {
      propertyManager.setChoices({
        [502]: 2, // go towards the stream in Arboreal Respite, so we can skip adventure
        [505]: 2, // skip adventure
      });
      adventureMacro($location`The Spooky Forest`, runSource.macro);
    },
    {
      requirements: () => [new Requirement([], { forceEquip: $items`latte lovers member's mug` })],
    }
  ),
  new FreeRunFight(
    () =>
      have($item`latte lovers member's mug`) &&
      !get("latteUnlocks").includes("carrot") &&
      get("latteUnlocks").includes("cajun") &&
      get("latteUnlocks").includes("rawhide"),
    (runSource: ActionSource) => {
      adventureMacro($location`The Dire Warren`, runSource.macro);
    },
    {
      requirements: () => [new Requirement([], { forceEquip: $items`latte lovers member's mug` })],
    }
  ),

  new FreeRunFight(
    () =>
      !doingExtrovermectin() &&
      have($familiar`Space Jellyfish`) &&
      have($skill`Meteor Lore`) &&
      get("_macrometeoriteUses") < 10 &&
      getStenchLocation() !== $location`none`,
    (runSource: ActionSource) => {
      adventureMacro(
        getStenchLocation(),
        Macro.while_(
          "!pastround 28 && hasskill macrometeorite",
          Macro.skill($skill`Extract Jelly`).skill($skill`Macrometeorite`)
        )
          .trySkill($skill`Extract Jelly`)
          .step(runSource.macro)
      );
    },
    {
      familiar: () => $familiar`Space Jellyfish`,
    }
  ),
  new FreeRunFight(
    () =>
      !doingExtrovermectin() &&
      have($familiar`Space Jellyfish`) &&
      have($item`Powerful Glove`) &&
      get("_powerfulGloveBatteryPowerUsed") < 91 &&
      getStenchLocation() !== $location`none`,
    (runSource: ActionSource) => {
      adventureMacro(
        getStenchLocation(),
        Macro.while_(
          "!pastround 28 && hasskill CHEAT CODE: Replace Enemy",
          Macro.skill($skill`Extract Jelly`).skill($skill`CHEAT CODE: Replace Enemy`)
        )
          .trySkill($skill`Extract Jelly`)
          .step(runSource.macro)
      );
    },
    {
      familiar: () => $familiar`Space Jellyfish`,
      requirements: () => [new Requirement([], { forceEquip: $items`Powerful Glove` })],
    }
  ),
  new FreeFight(
    () =>
      (get("gingerbreadCityAvailable") || get("_gingerbreadCityToday")) &&
      get("gingerAdvanceClockUnlocked") &&
      !get("_gingerbreadClockVisited") &&
      get("_gingerbreadCityTurns") <= 3,
    () => {
      propertyManager.setChoices({
        1215: 1, // Gingerbread Civic Center advance clock
      });
      adventureMacro($location`Gingerbread Civic Center`, Macro.abort());
    },
    {
      noncombat: () => true,
    }
  ),
  new FreeRunFight(
    () =>
      (get("gingerbreadCityAvailable") || get("_gingerbreadCityToday")) &&
      get("_gingerbreadCityTurns") + (get("_gingerbreadClockAdvanced") ? 5 : 0) < 9,
    (runSource: ActionSource) => {
      propertyManager.setChoices({
        1215: 1, // Gingerbread Civic Center advance clock
      });
      adventureMacro($location`Gingerbread Civic Center`, runSource.macro);
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
      requirements: () => [
        new Requirement([], {
          bonusEquip: new Map($items`carnivorous potted plant`.map((item) => [item, 100])),
        }),
      ],
    }
  ),
  new FreeFight(
    () =>
      (get("gingerbreadCityAvailable") || get("_gingerbreadCityToday")) &&
      get("_gingerbreadCityTurns") + (get("_gingerbreadClockAdvanced") ? 5 : 0) === 9,
    () => {
      propertyManager.setChoices({
        1204: 1, // Gingerbread Train Station Noon random candy
      });
      adventureMacro($location`Gingerbread Train Station`, Macro.abort());
    },
    {
      noncombat: () => true,
    }
  ),
  new FreeRunFight(
    () =>
      (get("gingerbreadCityAvailable") || get("_gingerbreadCityToday")) &&
      get("_gingerbreadCityTurns") + (get("_gingerbreadClockAdvanced") ? 5 : 0) >= 10 &&
      get("_gingerbreadCityTurns") + (get("_gingerbreadClockAdvanced") ? 5 : 0) < 19 &&
      availableAmount($item`sprinkles`) > 5,
    (runSource: ActionSource) => {
      propertyManager.setChoices({
        1215: 1, // Gingerbread Civic Center advance clock
      });
      adventureMacro($location`Gingerbread Civic Center`, runSource.macro);
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
      requirements: () => [
        new Requirement([], {
          bonusEquip: new Map($items`carnivorous potted plant`.map((item) => [item, 100])),
        }),
      ],
    }
  ),
  new FreeFight(
    () =>
      (get("gingerbreadCityAvailable") || get("_gingerbreadCityToday")) &&
      get("_gingerbreadCityTurns") + (get("_gingerbreadClockAdvanced") ? 5 : 0) === 19 &&
      availableAmount($item`sprinkles`) > 5,
    () => {
      propertyManager.setChoices({
        1203: 4, // Gingerbread Civic Center 5 gingerbread cigarettes
        1215: 1, // Gingerbread Civic Center advance clock
      });
      adventureMacro($location`Gingerbread Civic Center`, Macro.abort());
    },
    {
      noncombat: () => true,
    }
  ),
  // Fire Extinguisher on best available target.
  new FreeRunFight(
    () =>
      have($item`industrial fire extinguisher`) &&
      get("_fireExtinguisherCharge") >= 10 &&
      have($skill`Comprehensive Cartography`) &&
      get("_monstersMapped") < 3 &&
      get("_VYKEACompanionLevel") === 0 && // don't attempt this in case you re-run garbo after making a vykea furniture
      getBestItemStealZone() !== null,
    (runSource: ActionSource) => {
      setupItemStealZones();
      const best = getBestItemStealZone();
      if (!best) throw `Unable to find fire extinguisher zone?`;
      try {
        if (best.preReq) best.preReq();
        const vortex = $skill`Fire Extinguisher: Polar Vortex`;
        Macro.if_(`monsterid ${$monster`roller-skating Muse`.id}`, runSource.macro)
          .externalIf(
            myFamiliar() === $familiar`XO Skeleton` && get("_xoHugsUsed") < 11,
            Macro.skill($skill`Hugs and Kisses!`)
          )
          .step(itemStealOlfact(best))
          .while_(`hasskill ${toInt(vortex)}`, Macro.skill(vortex))
          .step(runSource.macro)
          .setAutoAttack();
        mapMonster(best.location, best.monster);
      } finally {
        setAutoAttack(0);
      }
    },
    {
      familiar: () =>
        have($familiar`XO Skeleton`) && get("_xoHugsUsed") < 11 ? $familiar`XO Skeleton` : null,
      requirements: () => {
        const zone = getBestItemStealZone();
        return [
          new Requirement(zone?.maximize ?? [], {
            forceEquip: $items`industrial fire extinguisher`,
          }),
        ];
      },
    }
  ),
  // Use XO pockets on best available target.
  new FreeRunFight(
    () =>
      have($familiar`XO Skeleton`) &&
      get("_xoHugsUsed") < 11 &&
      get("_VYKEACompanionLevel") === 0 && // don't attempt this in case you re-run garbo after making a vykea furniture
      getBestItemStealZone() !== null,
    (runSource: ActionSource) => {
      setupItemStealZones();
      const best = getBestItemStealZone();
      if (!best) throw `Unable to find XO Skeleton zone?`;
      try {
        if (best.preReq) best.preReq();
        Macro.if_(`!monsterid ${best.monster.id}`, runSource.macro)
          .step(itemStealOlfact(best))
          .skill($skill`Hugs and Kisses!`)
          .step(runSource.macro)
          .setAutoAttack();
        if (have($skill`Comprehensive Cartography`) && get("_monstersMapped") < 3) {
          mapMonster(best.location, best.monster);
        } else {
          adv1(best.location, -1, "");
        }
      } finally {
        setAutoAttack(0);
      }
    },
    {
      familiar: () => $familiar`XO Skeleton`,
      requirements: () => {
        const zone = getBestItemStealZone();
        return [new Requirement(zone?.maximize ?? [], {})];
      },
    }
  ),
  // Try for mini-hipster\goth kid free fights with any remaining non-familiar free runs
  new FreeRunFight(
    () =>
      get("_hipsterAdv") < 7 &&
      (have($familiar`Mini-Hipster`) || have($familiar`Artistic Goth Kid`)),
    (runSource: ActionSource) => {
      const targetLocation = determineDraggableZoneAndEnsureAccess("backup");
      adventureMacro(
        targetLocation,
        Macro.if_(
          `(monsterid 969) || (monsterid 970) || (monsterid 971) || (monsterid 972) || (monsterid 973) || (monstername Black Crayon *)`,
          Macro.basicCombat()
        ).step(runSource.macro)
      );
    },
    {
      familiar: () =>
        have($familiar`Mini-Hipster`) ? $familiar`Mini-Hipster` : $familiar`Artistic Goth Kid`,
      requirements: () => [
        new Requirement([], {
          bonusEquip: new Map<Item, number>(
            have($familiar`Mini-Hipster`)
              ? [
                  [$item`ironic moustache`, garboValue($item`mole skin notebook`)],
                  [$item`chiptune guitar`, garboValue($item`ironic knit cap`)],
                  [$item`fixed-gear bicycle`, garboValue($item`ironic oversized sunglasses`)],
                ]
              : []
          ),
        }),
      ],
    }
  ),
  // Try for an ultra-rare with mayfly runs ;)
  new FreeRunFight(
    () =>
      have($item`mayfly bait necklace`) &&
      canAdv($location`Cobb's Knob Menagerie, Level 1`, false) &&
      get("_mayflySummons") < 30,
    (runSource: ActionSource) => {
      adventureMacro(
        $location`Cobb's Knob Menagerie, Level 1`,
        Macro.if_($monster`QuickBASIC Elemental`, Macro.basicCombat())
          .if_($monster`BASIC Elemental`, Macro.trySkill($skill`Summon Mayfly Swarm`))
          .step(runSource.macro)
      );
    },
    {
      requirements: () => [
        new Requirement([], {
          forceEquip: $items`mayfly bait necklace`,
          bonusEquip: new Map($items`carnivorous potted plant`.map((item) => [item, 100])),
        }),
      ],
    }
  ),
];

function sandwormRequirement() {
  return new Requirement(
    ["100 Item Drop"],
    have($item`January's Garbage Tote`) && get("garbageChampagneCharge") > 0
      ? { forceEquip: $items`broken champagne bottle` }
      : {}
  );
}

const freeKillSources = [
  new FreeFight(
    () => !get("_gingerbreadMobHitUsed") && have($skill`Gingerbread Mob Hit`),
    () => {
      ensureBeachAccess();
      withMacro(Macro.trySkill($skill`Sing Along`).trySkill($skill`Gingerbread Mob Hit`), () =>
        use($item`drum machine`)
      );
    },
    {
      familiar: bestFairy,
      requirements: () => [sandwormRequirement()],
    }
  ),

  new FreeFight(
    () => (have($skill`Shattering Punch`) ? clamp(3 - get("_shatteringPunchUsed"), 0, 3) : 0),
    () => {
      ensureBeachAccess();
      withMacro(Macro.trySkill($skill`Sing Along`).trySkill($skill`Shattering Punch`), () =>
        use($item`drum machine`)
      );
    },
    {
      familiar: bestFairy,
      requirements: () => [sandwormRequirement()],
    }
  ),

  // 22	3	0	0	Chest X-Ray	combat skill	must have a Lil' Doctor™ bag equipped
  new FreeFight(
    () => (have($item`Lil' Doctor™ bag`) ? clamp(3 - get("_chestXRayUsed"), 0, 3) : 0),
    () => {
      ensureBeachAccess();
      withMacro(Macro.trySkill($skill`Sing Along`).trySkill($skill`Chest X-Ray`), () =>
        use($item`drum machine`)
      );
    },
    {
      familiar: bestFairy,
      requirements: () => [
        sandwormRequirement().merge(new Requirement([], { forceEquip: $items`Lil' Doctor™ bag` })),
      ],
    }
  ),

  new FreeFight(
    () => (have($item`replica bat-oomerang`) ? clamp(3 - get("_usedReplicaBatoomerang"), 0, 3) : 0),
    () => {
      ensureBeachAccess();
      withMacro(Macro.trySkill($skill`Sing Along`).item($item`replica bat-oomerang`), () =>
        use($item`drum machine`)
      );
    },
    {
      familiar: bestFairy,
      requirements: () => [sandwormRequirement()],
    }
  ),

  new FreeFight(
    () => !get("_missileLauncherUsed") && getCampground()["Asdon Martin keyfob"] !== undefined,
    () => {
      ensureBeachAccess();
      AsdonMartin.fillTo(100);
      withMacro(
        Macro.trySkill($skill`Sing Along`).skill($skill`Asdon Martin: Missile Launcher`),
        () => use($item`drum machine`)
      );
    },
    {
      familiar: bestFairy,
      requirements: () => [sandwormRequirement()],
    }
  ),

  new FreeFight(
    () => (globalOptions.ascending ? get("shockingLickCharges") : 0),
    () => {
      ensureBeachAccess();
      withMacro(Macro.trySkill($skill`Sing Along`).skill($skill`Shocking Lick`), () =>
        use($item`drum machine`)
      );
    },
    {
      familiar: bestFairy,
      requirements: () => [sandwormRequirement()],
    }
  ),
];

export function freeFights(): void {
  if (myInebriety() > inebrietyLimit()) return;
  if (
    get("beGregariousFightsLeft") > 0 &&
    get("beGregariousMonster") === $monster`Knob Goblin Embezzler`
  ) {
    return;
  }
  visitUrl("place.php?whichplace=town_wrong");

  propertyManager.setChoices({
    1387: 2, // "You will go find two friends and meet me here."
    1324: 5, // Fight a random partier
  });

  if (
    canAdv($location`The Red Zeppelin`, false) &&
    !have($item`glark cable`, clamp(5 - get("_glarkCableUses"), 0, 5))
  ) {
    buy(
      clamp(5 - get("_glarkCableUses"), 0, 5),
      $item`glark cable`,
      get("garbo_valueOfFreeFight", 2000)
    );
  }

  for (const freeFightSource of freeFightSources) {
    freeFightSource.runAll();
  }

  const stashRun = stashAmount($item`navel ring of navel gazing`)
    ? $items`navel ring of navel gazing`
    : stashAmount($item`Greatest American Pants`)
    ? $items`Greatest American Pants`
    : [];
  refreshStash();
  withStash(stashRun, () => {
    for (const freeRunFightSource of freeRunFightSources) {
      freeRunFightSource.runAll();
    }
  });

  tryFillLatte();

  // Use free fights on melanges if we have Tote/Squint and prices are reasonable.
  const canSquint =
    have($effect`Steely-Eyed Squint`) ||
    (have($skill`Steely-Eyed Squint`) && !get("_steelyEyedSquintUsed"));
  if (
    have($item`January's Garbage Tote`) &&
    canSquint &&
    mallPrice($item`drum machine`) < 0.02 * mallPrice($item`spice melange`)
  ) {
    try {
      for (const freeKillSource of freeKillSources) {
        if (freeKillSource.available() && get("garbageChampagneCharge") > 0) {
          // TODO: Add potions that are profitable for free kills.
          if (have($skill`Emotionally Chipped`) && get("_feelLostUsed") < 3) {
            ensureEffect($effect`Feeling Lost`);
          }
          ensureEffect($effect`Steely-Eyed Squint`);
        }

        freeKillSource.runAll();
      }
    } finally {
      if (have($effect`Feeling Lost`)) uneffect($effect`Feeling Lost`);
      if (have($item`January's Garbage Tote`)) cliExecute("fold wad of used tape");
    }
  }
}

function setNepQuestChoicesAndPrepItems() {
  if (get("_questPartyFair") === "unstarted") {
    visitUrl(toUrl($location`The Neverending Party`));
    if (["food", "booze"].includes(get("_questPartyFairQuest"))) {
      print("Gerald/ine quest!", HIGHLIGHT);
    }
    if (["food", "booze", "trash", "dj"].includes(get("_questPartyFairQuest"))) {
      runChoice(1); // Accept quest
    } else {
      runChoice(2); // Decline quest
    }
  }
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
      logMessage(`Geraldine wants ${partyFairInfo[0]} ${toItem(partyFairInfo[1]).plural}, please!`);
    }
  } else if (quest === "booze") {
    if (!questStep("_questPartyFair")) {
      setChoice(1324, 3); // Go to the back yard
      setChoice(1327, 3); // Find Gerald
    } else if (get("choiceAdventure1324") !== 5) {
      setChoice(1324, 5);
      print("Found Gerald!", HIGHLIGHT);
      const partyFairInfo = get("_questPartyFairProgress").split(" ");
      logMessage(`Gerald wants ${partyFairInfo[0]} ${toItem(partyFairInfo[1]).plural}, please!`);
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

function deliverThesis(): void {
  const thesisInNEP =
    (get("neverendingPartyAlways") || get("_neverEndingPartyToday")) &&
    questStep("_questPartyFair") < 999;

  useFamiliar($familiar`Pocket Professor`);
  freeFightMood().execute();
  freeFightOutfit(new Requirement(["100 muscle"], {}));
  safeRestore();

  if (
    have($item`Powerful Glove`) &&
    !have($effect`Triple-Sized`) &&
    get("_powerfulGloveBatteryPowerUsed") <= 95
  ) {
    cliExecute("checkpoint");
    equip($slot`acc1`, $item`Powerful Glove`);
    ensureEffect($effect`Triple-Sized`);
    outfit("checkpoint");
  }
  cliExecute("gain 1800 muscle");

  let thesisLocation = $location`Uncle Gator's Country Fun-Time Liquid Waste Sluice`;
  if (thesisInNEP) {
    // Set up NEP if we haven't yet
    setNepQuestChoicesAndPrepItems();
    thesisLocation = $location`The Neverending Party`;
  }
  // if running nobarf, might not have access to Uncle Gator's. Space is cheaper.
  else if (!canAdv(thesisLocation, false)) {
    if (!have($item`transporter transponder`)) {
      acquire(1, $item`transporter transponder`, 10000);
    }
    use($item`transporter transponder`);
    thesisLocation = $location`Hamburglaris Shield Generator`;
  }

  adventureMacro(
    thesisLocation,
    Macro.if_($monster`time-spinner prank`, Macro.basicCombat()).skill($skill`deliver your thesis!`)
  );
  postCombatActions();
}

function doSausage() {
  if (!kramcoGuaranteed()) {
    return;
  }
  useFamiliar(freeFightFamiliar());
  freeFightOutfit(new Requirement([], { forceEquip: $items`Kramco Sausage-o-Matic™` }));
  adventureMacroAuto(
    determineDraggableZoneAndEnsureAccess(),
    Macro.if_($monster`sausage goblin`, Macro.basicCombat()).abort()
  );
  if (getAutoAttack() !== 0) setAutoAttack(0);
  postCombatActions();
}

function ensureBeachAccess() {
  if (
    get("lastDesertUnlock") !== myAscensions() &&
    myPathId() !== 23 /* Actually Ed the Undying*/
  ) {
    cliExecute(`create ${$item`bitchin' meatcar`}`);
  }
}

type ItemStealZone = {
  item: Item;
  location: Location;
  monster: Monster;
  dropRate: number;
  maximize: string[];
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
    isOpen: () => true,
    openCost: () =>
      !have($effect`Absinthe-Minded`) ? mallPrice($item`tiny bottle of absinthe`) : 0,
    preReq: () => {
      if (!have($effect`Absinthe-Minded`)) {
        if (!have($item`tiny bottle of absinthe`)) buy(1, $item`tiny bottle of absinthe`);
        use($item`tiny bottle of absinthe`);
      }
    },
  },
  {
    location: $location`Twin Peak`,
    monster: $monster`bearpig topiary animal`,
    item: $item`rusty hedge trimmers`,
    dropRate: 0.5,
    maximize: ["99 monster level 11 max"], // Topiary animals need an extra 11 HP to survive polar vortices
    isOpen: () =>
      myLevel() >= 9 && get("chasmBridgeProgress") >= 30 && get("twinPeakProgress") >= 15,
    openCost: () => 0,
    preReq: null,
  },
] as ItemStealZone[];

function getBestItemStealZone(): ItemStealZone | null {
  const targets = itemStealZones.filter(
    (zone) =>
      zone.isOpen() &&
      (!isBanished(zone.monster) ||
        get("olfactedMonster") === zone.monster ||
        get("_gallapagosMonster") === zone.monster)
  );
  const vorticesAvail = Math.floor(get("_fireExtinguisherCharge") / 10);
  const hugsAvail = have($familiar`XO Skeleton`) ? clamp(11 - get("_xoHugsUsed"), 0, 11) : 0;
  const value = (zone: ItemStealZone): number => {
    // We have to divide hugs by 2 - will likely use a banish as a free run so we will be alternating zones.
    return (
      zone.dropRate * garboValue(zone.item) * (vorticesAvail + hugsAvail / 2) - zone.openCost()
    );
  };
  return (
    targets.sort((a, b) => {
      return value(b) - value(a);
    })[0] ?? null
  );
}

function setupItemStealZones() {
  // Haunted Library is full of free noncombats
  propertyManager.set({ lightsOutAutomation: 2 });
  propertyManager.setChoices({
    163: 4,
    164: 3,
    165: 4,
    166: 1,
    888: 4,
    889: 5,
  });
}

function itemStealOlfact(best: ItemStealZone) {
  return Macro.externalIf(
    have($skill`Transcendent Olfaction`) &&
      get("_olfactionsUsed") < 2 &&
      itemStealZones.every((zone) => get("olfactedMonster") !== zone.monster),
    Macro.skill($skill`Transcendent Olfaction`)
  ).externalIf(
    have($skill`Gallapagosian Mating Call`) && get("_gallapagosMonster") !== best.monster,
    Macro.skill($skill`Gallapagosian Mating Call`)
  );
}

const haveEnoughPills =
  clamp(availableAmount($item`synthetic dog hair pill`), 0, 100) +
    clamp(availableAmount($item`distention pill`), 0, 100) +
    availableAmount($item`Map to Safety Shelter Grimace Prime`) <
    200 && availableAmount($item`Map to Safety Shelter Grimace Prime`) < 60;
function wantPills(): boolean {
  return have($item`Fourth of May Cosplay Saber`) && crateStrategy() !== "Saber" && haveEnoughPills;
}

function voidMonster(): void {
  if (
    get("cursedMagnifyingGlassCount") < 13 ||
    !have($item`cursed magnifying glass`) ||
    get("_voidFreeFights") >= 5
  ) {
    return;
  }

  useFamiliar(freeFightFamiliar());
  freeFightOutfit(new Requirement([], { forceEquip: $items`cursed magnifying glass` }));
  adventureMacro(determineDraggableZoneAndEnsureAccess(), Macro.basicCombat());
  postCombatActions();
}

export function printEmbezzlerLog(): void {
  if (resetDailyPreference("garboEmbezzlerDate")) {
    property.set("garboEmbezzlerCount", 0);
    property.set("garboEmbezzlerSources", "");
  }
  const totalEmbezzlers =
    property.getNumber("garboEmbezzlerCount", 0) +
    embezzlerLog.initialEmbezzlersFought +
    embezzlerLog.digitizedEmbezzlersFought;

  const allEmbezzlerSources = property
    .getString("garboEmbezzlerSources")
    .split(",")
    .filter((source) => source);
  allEmbezzlerSources.push(...embezzlerLog.sources);

  property.set("garboEmbezzlerCount", totalEmbezzlers);
  property.set("garboEmbezzlerSources", allEmbezzlerSources.join(","));

  print(
    `You fought ${embezzlerLog.initialEmbezzlersFought} KGEs at the beginning of the day, and an additional ${embezzlerLog.digitizedEmbezzlersFought} digitized KGEs throughout the day. Good work, probably!`,
    HIGHLIGHT
  );
  print(
    `Including this, you have fought ${totalEmbezzlers} across all ascensions today`,
    HIGHLIGHT
  );
}
