import {
  adv1,
  canAdventure,
  canEquip,
  cliExecute,
  getWorkshed,
  Location,
  mallPrice,
  myAdventures,
  myLevel,
  myLightning,
  myRain,
  outfitPieces,
  totalTurnsPlayed,
  use,
  visitUrl,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $items,
  $location,
  $monster,
  $skill,
  ChestMimic,
  Counter,
  CrepeParachute,
  Delayed,
  get,
  getModifier,
  GingerBread,
  have,
  HeavyRains,
  LegendarySealClubbingClub,
  PeridotOfPeril,
  questStep,
  SourceTerminal,
  TrainSet,
  undelay,
  withChoice,
} from "libram";
import { Outfit, OutfitSpec, Quest } from "grimoire-kolmafia";
import {
  canAdventureOrUnlock,
  hasNameCollision,
  unperidotableZones,
  WanderDetails,
} from "garbo-lib";

import { Macro } from "../../combat";
import { GarboStrategy } from "../../combatStrategy";
import { globalOptions } from "../../config";
import { wanderer } from "../../garboWanderer";
import {
  kramcoGuaranteed,
  MEAT_TARGET_MULTIPLIER,
  romanticMonsterImpossible,
  sober,
  targetingMeat,
} from "../../lib";
import {
  familiarWaterBreathingEquipment,
  freeFightOutfit,
  FreeFightOutfitMenuOptions,
  meatTargetOutfit,
  waterBreathingEquipment,
} from "../../outfit";
import { deliverThesisIfAble } from "../../fights";
import { GarboTask } from "../engine";
import {
  canContinue,
  shouldCheckParachute,
  updateParachuteFailure,
} from "./lib";

import { garboValue } from "../../garboValue";
import { wanderingCopytargetsRemaining } from "../../turns";
import {
  bestMidnightAvailable,
  canBullseye,
  guaranteedBullseye,
  safeToAttemptBullseye,
  shouldFillLatte,
  shouldMakeEgg,
  tryFillLatte,
  willYachtzee,
} from "../../resources";
import { acquire } from "../../acquire";

const isGhost = () => get("_voteMonster") === $monster`angry ghost`;
const isMutant = () => get("_voteMonster") === $monster`terrible mutant`;
const isSteve = () =>
  get("nextSpookyravenStephenRoom") === $location`The Haunted Laboratory`;

function createWandererOutfit(
  details: Delayed<WanderDetails>,
  spec: Delayed<OutfitSpec>,
  additionalOutfitOptions: Omit<FreeFightOutfitMenuOptions, "wanderOptions">,
): Outfit {
  const wanderTarget = wanderer().getTarget(undelay(details));
  const needPeridot = wanderTarget.peridotMonster !== $monster.none;
  const needBCZ = wanderTarget.useRefractedGaze ?? false;
  const needMonodent = wanderTarget.useFeesh ?? false;

  const sourceOutfit = Outfit.from(
    undelay(spec),
    new Error(
      `Failed to build outfit for Wanderer from ${JSON.stringify(undelay(spec))}`,
    ),
  );
  if (wanderTarget.familiar !== $familiar`none`) {
    sourceOutfit.familiar = wanderTarget.familiar;
  }
  if (needPeridot) sourceOutfit.equip($item`Peridot of Peril`);
  if (needBCZ) sourceOutfit.equip($item`blood cubic zirconia`);
  if (needMonodent) sourceOutfit.equip($item`Monodent of the Sea`);

  return freeFightOutfit(
    sourceOutfit.spec(),
    undelay(details),
    additionalOutfitOptions,
  );
}

function wanderTask(
  details: Delayed<WanderDetails>,
  spec: Delayed<OutfitSpec>,
  base: Omit<GarboTask, "outfit" | "do" | "choices" | "spendsTurn"> & {
    combat?: GarboStrategy;
  },
  additionalOutfitOptions: Omit<
    FreeFightOutfitMenuOptions,
    "wanderOptions"
  > = {},
): GarboTask {
  return {
    do: () => wanderer().getTarget(undelay(details)).location,
    choices: () => wanderer().getChoices(undelay(details)),
    outfit: () => createWandererOutfit(details, spec, additionalOutfitOptions),
    spendsTurn: false,
    combat: new GarboStrategy(() => Macro.basicCombat()),
    ...base,
  };
}

function shouldGoUnderwater(): boolean {
  if (!sober()) return false;
  if (myLevel() < 11) return false;

  if (questStep("questS01OldGuy") === -1) {
    visitUrl("place.php?whichplace=sea_oldman&action=oldman_oldman");
  }

  if (
    !getModifier("Adventure Underwater") &&
    waterBreathingEquipment.every((item) => !have(item) || !canEquip(item))
  ) {
    return false;
  }
  if (
    !getModifier("Underwater Familiar") &&
    familiarWaterBreathingEquipment.every((item) => !have(item))
  ) {
    return false;
  }

  if (
    have($item`envyfish egg`) ||
    (globalOptions.ascend && get("_envyfishEggUsed"))
  ) {
    return false;
  }
  if (!canAdventure($location`The Briny Deeps`)) return false;

  // TODO: if you didn't digitize a target, this equation may not be right
  if (
    mallPrice($item`pulled green taffy`) >
    (targetingMeat()
      ? MEAT_TARGET_MULTIPLIER() * get("valueOfAdventure")
      : get("valueOfAdventure"))
  ) {
    return false;
  }

  if (have($effect`Fishy`)) return true;
  if (willYachtzee()) return false;
  if (have($item`fishy pipe`) && !get("_fishyPipeUsed")) {
    use($item`fishy pipe`);
    if (have($effect`Fishy`)) return true;
  }

  if (get("skateParkStatus") === "ice" && !get("_skateBuff1")) {
    cliExecute("skate lutz");
    if (have($effect`Fishy`)) return true;
  }

  return false;
}

/**
 * Creates autoattack and postAuto macros for digitize wanderer fights.
 * @param targetKillMacro - Macro to use when digitize monster is the target
 * @param nonTargetKillMacro - Macro to use otherwise (defaults to Macro.kill())
 */
function digitizeMacros(prepend?: Delayed<Macro>): [() => Macro, () => Macro] {
  const makeMacro =
    (useAutoattackCondition: boolean): (() => Macro) =>
    () => {
      const digitizeMonster =
        SourceTerminal.getDigitizeMonster() ?? $monster.none;
      const condition = useAutoattackCondition
        ? digitizeMonster
        : `(monsterid ${digitizeMonster.id}) && !gotjump && !(pastround 2)`;
      return Macro.if_(
        condition,
        Macro.externalIf(
          digitizeMonster === globalOptions.target,
          (undelay(prepend) ?? new Macro()).meatKill(),
          Macro.kill(),
        ),
      ).abortWithMsg(
        `Expected a digitized ${digitizeMonster}, but encountered something else.`,
      );
    };
  return [makeMacro(true), makeMacro(false)];
}

const mimicSpec = () =>
  get("_mimicEggsObtained") < 11 &&
  $familiar`Chest Mimic`.experience >
    (wanderingCopytargetsRemaining() === 1
      ? 50
      : (11 - get("_mimicEggsObtained")) * 50)
    ? { familiar: $familiar`Chest Mimic` }
    : {};

const digitizedTarget = () =>
  SourceTerminal.have() &&
  SourceTerminal.getDigitizeMonster() === globalOptions.target;

const BarfTurnTasks: GarboTask[] = [
  {
    name: "Latte",
    completed: () => !shouldFillLatte(),
    do: () => tryFillLatte(),
    spendsTurn: false,
  },
  {
    name: "Lights Out",
    ready: () =>
      canAdventure(get("nextSpookyravenStephenRoom") ?? $location`none`) &&
      get("nextSpookyravenStephenRoom") !== get("ghostLocation") &&
      totalTurnsPlayed() % 37 === 0,
    completed: () => totalTurnsPlayed() === get("lastLightsOutTurn"),
    do: () => get("nextSpookyravenStephenRoom") as Location,
    outfit: () =>
      meatTargetOutfit(sober() ? {} : { offhand: $item`Drunkula's wineglass` }),
    spendsTurn: isSteve,
    combat: new GarboStrategy(() =>
      Macro.if_(
        $monster`Stephen Spookyraven`,
        Macro.basicCombat(),
      ).abortWithMsg("Expected to fight Stephen Spookyraven, but didn't!"),
    ),
  },
  {
    name: "Use Walkie Talkie for Ghost",
    ready: () =>
      mallPrice($item`almost-dead walkie-talkie`) <
        globalOptions.prefs.valueOfFreeFight &&
      get("nextParanormalActivity") <= totalTurnsPlayed(),
    completed: () =>
      have($item`protonic accelerator pack`) ||
      get("questPAGhost") === "started",
    do: () => {
      if (
        acquire(
          1,
          $item`almost-dead walkie-talkie`,
          globalOptions.prefs.valueOfFreeFight,
          false,
        )
      ) {
        use($item`almost-dead walkie-talkie`);
      }
    },
    spendsTurn: false,
    limit: { skip: 40 }, // Safeguard to avoid infinite loops if mallPrice can bug
  },
  {
    name: "Proton Ghost",
    ready: () => !!get("ghostLocation"),
    completed: () => get("questPAGhost") === "unstarted",
    do: () => get("ghostLocation") as Location,
    outfit: () =>
      freeFightOutfit(
        {
          modifier:
            get("ghostLocation") === $location`The Icy Peak`
              ? ["Cold Resistance 5 min"]
              : [],
          back: have($item`protonic accelerator pack`)
            ? $item`protonic accelerator pack`
            : [],
        },
        get("ghostLocation") as Location,
      ),
    choices: () =>
      wanderer().getChoices(get("ghostLocation") ?? $location.none),
    combat: new GarboStrategy(() =>
      have($item`protonic accelerator pack`)
        ? Macro.ghostBustin()
        : Macro.basicCombat(),
    ),
    spendsTurn: false,
    // Ghost fights are currently hard
    // and they resist physical attacks!
    sobriety: "sober",
  },
  wanderTask(
    () => ({ wanderer: "wanderer", drunkSafe: !isGhost() }),
    () => ({
      equip: [
        $item`"I Voted!" sticker`,
        ...(!sober() && !isGhost() ? $items`Drunkula's wineglass` : []),
        ...(!have($item`mutant crown`) && isMutant()
          ? $items`mutant arm, mutant legs`.filter((i) => have(i))
          : []),
      ],
    }),
    {
      name: "Vote Wanderer",
      ready: () =>
        have($item`"I Voted!" sticker`) &&
        totalTurnsPlayed() % 11 === 1 &&
        get("_voteFreeFights") < 3,
      completed: () => get("lastVoteMonsterTurn") >= totalTurnsPlayed(),
      sobriety: () => (isGhost() ? "sober" : undefined),
    },
  ),
  {
    name: "Thesis",
    ready: () =>
      have($familiar`Pocket Professor`) &&
      myAdventures() === 1 + globalOptions.saveTurns &&
      $familiar`Pocket Professor`.experience >= 400,
    completed: () => get("_thesisDelivered"),
    do: () => deliverThesisIfAble(),
    sobriety: "sober",
    spendsTurn: true,
  },
  {
    name: "Digitize Wanderer (Underwater, for Green Taffy)",
    completed: () => Counter.get("Digitize Monster") > 0,
    ready: shouldGoUnderwater,
    acquire: () => [{ item: $item`pulled green taffy` }],
    do: $location`The Briny Deeps`,
    outfit: () => meatTargetOutfit({}, $location`The Briny Deeps`),
    combat: new GarboStrategy(
      ...digitizeMacros(Macro.item($item`pulled green taffy`)),
    ),
    sobriety: "sober",
    spendsTurn: true,
  },
  {
    name: "Digitize Wanderer",
    completed: () => Counter.get("Digitize Monster") > 0,
    outfit: () =>
      digitizedTarget()
        ? meatTargetOutfit(mimicSpec(), {
            wanderer: "wanderer",
            allowEquipment: false,
          })
        : freeFightOutfit(
            undefined,
            wanderer().getTarget({
              wanderer: "wanderer",
              allowEquipment: false,
            }).location,
          ),
    do: () =>
      wanderer().getTarget({ wanderer: "wanderer", allowEquipment: false })
        .location,
    choices: () =>
      wanderer().getChoices({
        wanderer: "wanderer",
        allowEquipment: false,
      }),
    combat: new GarboStrategy(...digitizeMacros()),
    spendsTurn: () =>
      !SourceTerminal.getDigitizeMonster()?.attributes.includes("FREE"),
  },
  {
    name: "Club Into Next Week Monster",
    completed: () => LegendarySealClubbingClub.turnsUntilNextWeekFight() > 0,
    outfit: () =>
      LegendarySealClubbingClub.clubIntoNextWeekMonster() ===
      globalOptions.target
        ? meatTargetOutfit(mimicSpec(), {
            wanderer: "wanderer",
            allowEquipment: false,
          })
        : freeFightOutfit({}, { wanderer: "wanderer", allowEquipment: false }),
    do: () =>
      wanderer().getTarget({ wanderer: "wanderer", allowEquipment: false })
        .location,
    choices: () =>
      wanderer().getChoices({
        wanderer: "wanderer",
        allowEquipment: false,
      }),
    combat: new GarboStrategy(() => Macro.target("club 'em into next week")),
    spendsTurn: () =>
      !LegendarySealClubbingClub.clubIntoNextWeekMonster()?.attributes.includes(
        "FREE",
      ),
  },
  wanderTask(
    "wanderer",
    {
      offhand: $item`Kramco Sausage-o-Matic™`,
    },
    {
      name: "Guaranteed Kramco",
      ready: () => romanticMonsterImpossible(),
      completed: () => !kramcoGuaranteed(),
    },
  ),
  wanderTask(
    "wanderer",
    {
      offhand: $item`cursed magnifying glass`,
    },
    {
      name: "Void Monster",
      ready: () =>
        have($item`cursed magnifying glass`) && get("_voidFreeFights") < 5,
      completed: () => get("cursedMagnifyingGlassCount") !== 13,
    },
  ),
  {
    name: "Envyfish Egg",
    ready: () =>
      have($item`envyfish egg`) &&
      get("envyfishMonster") === globalOptions.target,
    completed: () => get("_envyfishEggUsed"),
    do: () => use($item`envyfish egg`),
    spendsTurn: true,
    outfit: meatTargetOutfit,
    combat: new GarboStrategy(() => Macro.target("envyfish egg")),
  },
  wanderTask(
    "yellow ray",
    {},
    {
      name: "Cheese Wizard Fondeluge",
      ready: () => have($skill`Fondeluge`) && romanticMonsterImpossible(),
      completed: () => have($effect`Everything Looks Yellow`),
      combat: new GarboStrategy(() =>
        Macro.if_(globalOptions.target, Macro.meatKill())
          .refractedGaze()
          .familiarActions()
          .duplicate()
          .skill($skill`Fondeluge`),
      ),
      duplicate: true,
      sobriety: "sober",
    },
  ),
  wanderTask(
    "yellow ray",
    { shirt: $items`Jurassic Parka`, modes: { parka: "dilophosaur" } },
    {
      name: "Spit Acid",
      ready: () => have($item`Jurassic Parka`) && romanticMonsterImpossible(),
      completed: () => have($effect`Everything Looks Yellow`),
      combat: new GarboStrategy(() =>
        Macro.if_(globalOptions.target, Macro.meatKill())
          .refractedGaze()
          .familiarActions()
          .duplicate()
          .skill($skill`Spit jurassic acid`),
      ),
      sobriety: "sober",
      duplicate: true,
    },
  ),
  wanderTask(
    "freefight (no items)",
    () => ({
      weapon: $item`Sheriff pistol`,
      acc1: $item`Sheriff badge`,
      acc2: $item`Sheriff moustache`,
    }),
    {
      name: "Assert your Authority",
      ready: () =>
        have($item`Sheriff pistol`) &&
        have($item`Sheriff badge`) &&
        have($item`Sheriff moustache`) &&
        romanticMonsterImpossible(),
      completed: () => get("_assertYourAuthorityCast") >= 3,
      combat: new GarboStrategy(() =>
        Macro.if_(globalOptions.target, Macro.meatKill())
          .familiarActions()
          .skill($skill`Assert your Authority`),
      ),
      sobriety: "sober",
    },
  ),
  wanderTask(
    "freefight",
    {},
    {
      name: "Pig Skinner Free-For-All",
      ready: () => have($skill`Free-For-All`) && romanticMonsterImpossible(),
      completed: () => have($effect`Everything Looks Red`),
      combat: new GarboStrategy(() =>
        Macro.if_(globalOptions.target, Macro.meatKill())
          .refractedGaze()
          .familiarActions()
          .skill($skill`Free-For-All`),
      ),
      sobriety: "sober",
      duplicate: true,
    },
  ),
  wanderTask(
    "conditional freefight",
    {
      offhand:
        guaranteedBullseye() || have($item`spring shoes`)
          ? []
          : $item`Roman Candelabra`,
      acc1: $item`Everfull Dart Holster`,
      acc2:
        guaranteedBullseye() || !have($item`spring shoes`)
          ? []
          : $item`spring shoes`,
      modifier: guaranteedBullseye() ? [] : "Monster Level",
    },
    {
      name: "Darts: Bullseye",
      ready: safeToAttemptBullseye,
      completed: () => !canBullseye(),
      combat: new GarboStrategy(() =>
        Macro.if_(globalOptions.target, Macro.meatKill())
          .familiarActions()
          .skill($skill`Darts: Aim for the Bullseye`)
          .trySkill($skill`Spring Away`)
          .trySkill($skill`Blow the Green Candle!`),
      ),
      sobriety: "sober",
      duplicate: true,
    },
  ),
  wanderTask(
    "freefight",
    {},
    {
      name: "Heavy Rains Lightning Strike",
      ready: () => have($skill`Lightning Strike`) && myLightning() >= 20,
      completed: () => myLightning() < 20,
      combat: new GarboStrategy(() =>
        Macro.if_(globalOptions.target, Macro.meatKill())
          .refractedGaze()
          .familiarActions()
          .skill($skill`Lightning Strike`),
      ),
      duplicate: true,
    },
  ),
  wanderTask(
    "yellow ray",
    {},
    {
      name: "Shocking Lick",
      ready: () => romanticMonsterImpossible(),
      completed: () => get("shockingLickCharges") === 0,
      combat: new GarboStrategy(() =>
        Macro.if_(globalOptions.target, Macro.meatKill())
          .refractedGaze()
          .familiarActions()
          .duplicate()
          .skill($skill`Shocking Lick`),
      ),
      duplicate: true,
      sobriety: "sober",
    },
  ),
  wanderTask(
    "freerun",
    () => ({
      equip: $items`spring shoes, carnivorous potted plant`.filter((i) =>
        have(i),
      ),
    }),
    {
      name: "Spring Shoes Freerun",
      ready: () =>
        have($item`spring shoes`) &&
        romanticMonsterImpossible() &&
        (getWorkshed() !== $item`model train set` ||
          TrainSet.next() !== TrainSet.Station.GAIN_MEAT) &&
        (guaranteedBullseye() ||
          !safeToAttemptBullseye() ||
          have($skill`Free-For-All`) ||
          have($effect`Everything Looks Red`, 30)),
      completed: () => have($effect`Everything Looks Green`),
      combat: new GarboStrategy(
        () =>
          Macro.if_(globalOptions.target, Macro.meatKill())
            .familiarActions()
            .skill($skill`Spring Away`),
        undefined,
        () => !have($item`carnivorous potted plant`), // Do not use autoattack with carn plant, it will cancel the swallow
      ),
      sobriety: "sober",
    },
    {
      familiarOptions: {
        mode: "run",
      },
    },
  ),
  {
    name: "Gingerbread Noon",
    completed: () => GingerBread.minutesToNoon() !== 0,
    do: $location`Gingerbread Train Station`,
    choices: { 1204: 1 },
    combat: new GarboStrategy(() =>
      Macro.abortWithMsg(
        "We thought it was noon here in Gingerbread City, but we're in a fight!",
      ),
    ),
    outfit: () => (sober() ? {} : { offhand: $item`Drunkula's wineglass` }),
    spendsTurn: false,
  },
  {
    name: "Gingerbread Midnight",
    completed: () => GingerBread.minutesToMidnight() !== 0,
    do: () => bestMidnightAvailable().location,
    choices: () => bestMidnightAvailable().choices,
    outfit: () => ({
      equip:
        bestMidnightAvailable().location ===
        $location`Gingerbread Upscale Retail District`
          ? outfitPieces("Gingerbread Best")
          : [],
      offhand: sober() ? undefined : $item`Drunkula's wineglass`,
    }),
    combat: new GarboStrategy(() =>
      Macro.abortWithMsg(
        "We thought it was Midnight here in Gingerbread City, but we're in a fight!",
      ),
    ),
    spendsTurn: false,
  },
  {
    name: "Rain Man",
    ready: () => myRain() >= 50 && have($skill`Rain Man`),
    completed: () => myRain() < 50,
    do: () => {
      HeavyRains.rainMan(globalOptions.target);
    },
    combat: new GarboStrategy(() => Macro.meatKill()),
    spendsTurn: () => !globalOptions.target.attributes.includes("FREE"),
    outfit: () => meatTargetOutfit(),
  },
  {
    name: "Make Mimic Eggs (maximum eggs)",
    ready: () => shouldMakeEgg(true),
    completed: () => get("_mimicEggsObtained") >= 11,
    do: () => {
      if (ChestMimic.differentiableQuantity(globalOptions.target) < 1) {
        ChestMimic.receive(globalOptions.target);
      }
      ChestMimic.differentiate(globalOptions.target);
    },
    combat: new GarboStrategy(() => Macro.meatKill()),
    spendsTurn: () => !globalOptions.target.attributes.includes("FREE"),
    outfit: () => meatTargetOutfit({ familiar: $familiar`Chest Mimic` }),
  },
  {
    name: "Fight Mimic Eggs",
    ready: () => globalOptions.ascend,
    completed: () =>
      ChestMimic.differentiableQuantity(globalOptions.target) === 0,
    do: () => ChestMimic.differentiate(globalOptions.target),
    outfit: () => meatTargetOutfit(),
    combat: new GarboStrategy(() => Macro.meatKill()),
    spendsTurn: () => !globalOptions.target.attributes.includes("FREE"),
  },
  {
    name: "Liana Parachute",
    ready: () =>
      (sober() ||
        (have($item`Drunkula's wineglass`) &&
          canEquip($item`Drunkula's wineglass`))) &&
      CrepeParachute.have() &&
      shouldCheckParachute() &&
      questStep("questL11Worship") > 3 &&
      have($item`antique machete`), // TODO Support other machete's
    completed: () => have($effect`Everything looks Beige`),
    outfit: () =>
      freeFightOutfit({ weapon: $item`antique machete` }, Location.none),
    do: () => CrepeParachute.fight($monster`dense liana`),
    combat: new GarboStrategy(() =>
      Macro.abortWithMsg(
        "Did not instantly kill the Liana, check what went wrong",
      ),
    ),
    prepare: () => {
      if (!sober()) {
        freeFightOutfit(
          { offhand: $item`Drunkula's wineglass` },
          Location.none,
        ).dress();
      }
      withChoice(785, 6, () =>
        adv1($location`An Overgrown Shrine (Northeast)`, -1, ""),
      );
      if (!sober()) {
        freeFightOutfit(
          { weapon: $item`antique machete` },
          Location.none,
        ).dress();
      }
    },
    post: () => {
      if (!have($effect`Everything looks Beige`)) updateParachuteFailure();
    },
    spendsTurn: false,
  },
  {
    name: "Fight Cookbookbat Quest Target",
    ready: () => {
      const questMonster = get("_cookbookbatQuestMonster");
      if (!questMonster || hasNameCollision(questMonster)) return false;
      const questLocation = get("_cookbookbatQuestLastLocation");
      if (!questLocation || !canAdventureOrUnlock(questLocation, false)) {
        return false;
      }
      const questReward = get("_cookbookbatQuestIngredient");
      return (
        PeridotOfPeril.have() &&
        !!questReward &&
        3 * garboValue(questReward) > get("valueOfAdventure")
      );
    },
    completed: () => {
      const questLocation = get("_cookbookbatQuestLastLocation");
      return (
        !questLocation ||
        !PeridotOfPeril.canImperil(questLocation) ||
        unperidotableZones.includes(questLocation)
      );
    },
    choices: () => ({
      1557: `1&bandersnatch=${get("_cookbookbatQuestMonster")?.id ?? 0}`,
      ...wanderer().getChoices(
        get("_cookbookbatQuestLastLocation") ?? $location.none,
      ),
    }),
    outfit: () =>
      freeFightOutfit(
        {
          equip: sober()
            ? $items`Peridot of Peril`
            : $items`Peridot of Peril, Drunkula's wineglass`,
          familiar: $familiar`Cookbookbat`,
        },
        get("_cookbookbatQuestLastLocation") ?? Location.none,
      ),
    do: () => get("_cookbookbatQuestLastLocation"),
    combat: new GarboStrategy(() => Macro.basicCombat()),
    spendsTurn: true,
  },
];

export const WandererQuest: Quest<GarboTask> = {
  name: "Wanderers",
  tasks: BarfTurnTasks,
  completed: () => !canContinue(),
};
