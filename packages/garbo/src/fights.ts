import {
  getBestItemStealZone,
  ItemStealZone,
  itemStealZones,
} from "./tasks/itemSteal/lib";
import { Outfit, OutfitSpec } from "grimoire-kolmafia";
import { EmbezzlerFightsQuest } from "./tasks/embezzler";
import { runGarboFreeFightQuests, runGarboQuests } from "./tasks/engine";
import { FreeMimicEggDonationQuest } from "./tasks/freeEggDonation";
import {
  adv1,
  availableAmount,
  canAdventure,
  canEquip,
  cliExecute,
  create,
  Effect,
  familiarEquippedEquipment,
  getAutoAttack,
  haveOutfit,
  Item,
  itemAmount,
  Location,
  mallPrice,
  maximize,
  Monster,
  myAdventures,
  myClass,
  myFamiliar,
  myThrall,
  myTurncount,
  outfit,
  print,
  refreshStash,
  retrieveItem,
  runCombat,
  setAutoAttack,
  setLocation,
  Skill,
  stashAmount,
  totalTurnsPlayed,
  use,
  useFamiliar,
  useSkill,
} from "kolmafia";
import {
  $class,
  $effect,
  $familiar,
  $item,
  $items,
  $location,
  $locations,
  $monster,
  $monsters,
  $skill,
  $thrall,
  ActionSource,
  BatWings,
  Cartography,
  ChestMimic,
  clamp,
  CombatLoversLocket,
  Counter,
  Delayed,
  FindActionSourceConstraints,
  get,
  GingerBread,
  have,
  Latte,
  PocketProfessor,
  property,
  Robortender,
  set,
  Snapper,
  SourceTerminal,
  undelay,
} from "libram";
import { WanderDetails } from "garbo-lib";

import { withStash } from "./clan";
import { garboAdventure, garboAdventureAuto, Macro, withMacro } from "./combat";
import { globalOptions } from "./config";
import { postFreeFightDailySetup } from "./dailiespost";

import {
  doingGregFight,
  initializeExtrovermectinZones,
  saberCrateIfSafe,
} from "./resources/extrovermectin";
import { bestMidnightAvailable } from "./resources/gingerbread";
import { shouldUnlockIngredients, tryFillLatte } from "./resources/latte";
import { freeFightFamiliar } from "./familiar/freeFightFamiliar";
import {
  meatFamiliar,
  setBestLeprechaunAsMeatFamiliar,
  underwaterMeatFamiliar,
} from "./familiar/meatFamiliar";
import {
  asArray,
  bestShadowRift,
  burnLibrams,
  eventLog,
  expectedTargetProfit,
  freeRunConstraints,
  isFree,
  isFreeAndCopyable,
  isStrongScaler,
  kramcoGuaranteed,
  mapMonster,
  maxPassiveDamage,
  monsterManuelAvailable,
  propertyManager,
  RequireAtLeastOne,
  romanticMonsterImpossible,
  setChoice,
  sober,
  targetingMeat,
  targetMeat,
  tryFindFreeRunOrBanish,
  userConfirmDialog,
  valueDrops,
} from "./lib";
import { safeRestore } from "./restore";
import { freeFightMood, meatMood } from "./mood";
import { freeFightOutfit, FreeFightOutfitMenuOptions } from "./outfit/free";
import { toSpec } from "./outfit/lib";
import { meatTargetOutfit } from "./outfit/target";
import postCombatActions from "./post";
import { bathroomFinance, potionSetup } from "./potions";
import { garboValue } from "./garboValue";
import { wanderer } from "./garboWanderer";
import { runTargetFight } from "./target/execution";
import { TargetFightRunOptions } from "./target/staging";

import {
  freeFightQuest,
  mappingRecoveryQuest,
  possibleFreeFightQuestTentacleFights,
} from "./tasks/freeFight";
import { PostQuest } from "./tasks/post";
import {
  expectedFreeGiantSandwormQuestFights,
  FreeGiantSandwormQuest,
} from "./tasks/freeGiantSandworm";
import {
  CopyTargetFight,
  copyTargetSources,
  getNextCopyTargetFight,
} from "./target/fights";
import {
  BuffExtensionQuest,
  PostBuffExtensionQuest,
} from "./tasks/buffExtension";
import { highMeatMonsterCount } from "./turns";

import { deliverThesisIfAble } from "./tasks/thesis";
export { deliverThesisIfAble } from "./tasks/thesis";

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
          )
          .tryCopier($skill`Club 'Em Into Next Week`),
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
          )
          .tryCopier($skill`Club 'Em Into Next Week`),
      )
      .trySkill($skill`lecture on relativity`)
      .meatKill(false),
  ).abort();

function meatTargetSetup() {
  setLocation($location`Friar Ceremony Location`);
  potionSetup(false);
  maximize("MP", false);
  meatMood({ urKels: true, meat: targetMeat() }).execute(
    highMeatMonsterCount(),
  );
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

  return {
    familiar: underwater ? underwaterMeatFamiliar() : meatFamiliar(),
  };
}

export function dailyFights(): void {
  if (!sober()) return;

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
            goalMaximize: (spec: OutfitSpec, location: Location) =>
              meatTargetOutfit(spec, {
                location,
                target: globalOptions.target,
              }).dress(),
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
            avoid: $items`Roman Candelabra, legendary seal-clubbing club`,
          };
          if (have(chip)) {
            profSpec.famequip = chip;
          }

          goalMaximize(
            { ...profSpec, ...fightSource.spec },
            fightSource.location ?? $location.none,
          );

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
      }
    });
  }
}

type FreeFightOptions = {
  cost?: () => number;
  spec?: Delayed<OutfitSpec>;
  noncombat?: () => boolean;
  effects?: () => Effect[];
  postTask?: () => void;

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

function getStenchLocation() {
  return (
    $locations`Uncle Gator's Country Fun-Time Liquid Waste Sluice, The Hippy Camp (Bombed Back to the Stone Age), The Dark and Spooky Swamp`.find(
      (l) => canAdventure(l),
    ) ?? $location.none
  );
}

const priorityFreeRunFightSources = [
  new FreeRunFight(
    () =>
      have($familiar`Patriotic Eagle`) &&
      !have($effect`Citizen of a Zone`) &&
      $locations`Barf Mountain, The Fun-Guy Mansion, The Dire Warren`.some(
        (l) => canAdventure(l),
      ),
    (runSource: ActionSource) => {
      const location =
        $locations`Barf Mountain, The Fun-Guy Mansion, The Dire Warren`.find(
          (l) => canAdventure(l),
        );
      if (!location) {
        throw new Error("Somehow, we can't adventure in the Dire Warren.");
      }
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
        : $location`The Dire Warren`,
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
  // Gingerbread clock/noon/midnight choices stay interleaved with free runs.
  // These free choices do not require a remaining escape source.
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

function freeRunFights(): void {
  if (!sober()) return;
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
  // These fights change familiars, so exclude Stooper's extra capacity.
  if (!sober()) return;
  if (targetCopiesInProgress()) return;

  propertyManager.setChoices({
    1387: 2, // "You will go find two friends and meet me here."
    1324: 5, // Fight a random partier
  });

  freeRunFights();

  killRobortCreaturesForFree();

  runGarboFreeFightQuests([
    PostQuest(),
    freeFightQuest(),
    FreeGiantSandwormQuest,
    mappingRecoveryQuest(),
  ]);

  // Run any community endeavors
  runGarboQuests([PostQuest(), undelay(FreeMimicEggDonationQuest)]);

  tryFillLatte();
  postFreeFightDailySetup();
}

function doSausage(): void {
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
    (!globalOptions.nobarf || targetingMeat()) &&
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

// Possible additional free fights from Eldritch Attunement
export function estimatedAttunementTentacles(): number {
  const totalFreeFights =
    possibleFreeFightQuestTentacleFights() +
    expectedFreeGiantSandwormQuestFights();
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
