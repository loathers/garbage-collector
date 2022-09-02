import {
  availableAmount,
  canAdventure,
  currentRound,
  inebrietyLimit,
  myAdventures,
  myInebriety,
  myLevel,
  runChoice,
  runCombat,
  totalTurnsPlayed,
  toUrl,
  use,
  useFamiliar,
  visitUrl,
} from "kolmafia";
import {
  $effect,
  $item,
  $items,
  $location,
  $monster,
  $skill,
  adventureMacro,
  adventureMacroAuto,
  clamp,
  Counter,
  ensureEffect,
  get,
  getModifier,
  have,
  Requirement,
  SourceTerminal,
} from "libram";
import { Macro, withMacro } from "./combat";
import { completeBarfQuest } from "./dailies";
import { estimatedTurns } from "./embezzler";
import { barfFamiliar, freeFightFamiliar, meatFamiliar } from "./familiar";
import {
  embezzlerLog,
  globalOptions,
  kramcoGuaranteed,
  safeRestore,
  setChoice,
  steveAdventures,
} from "./lib";
import { meatMood } from "./mood";
import {
  familiarWaterBreathingEquipment,
  freeFightOutfit,
  meatOutfit,
  tryFillLatte,
  waterBreathingEquipment,
} from "./outfit";
import { determineDraggableZoneAndEnsureAccess, digitizedMonstersRemaining } from "./wanderer";
const embezzler = $monster`Knob Goblin Embezzler`;

function embezzlerPrep(requirements?: Requirement) {
  useFamiliar(meatFamiliar());
  meatOutfit(true, requirements);
}

function freeFightPrep(requirements?: Requirement) {
  useFamiliar(freeFightFamiliar(true));
  freeFightOutfit(requirements);
}

const sober = () => myInebriety() <= inebrietyLimit();

type Turn = {
  name: string;
  available: () => boolean;
  perform: () => boolean;
};

const turns: Turn[] = [
  {
    name: "Lights Out",
    available: () =>
      totalTurnsPlayed() % 37 === 0 && totalTurnsPlayed() !== get("lastLightsOutTurn"),
    perform: () => {
      const steveRoom = get("nextSpookyravenStephenRoom");
      const ghostLocation = get("ghostLocation");
      if (steveRoom && canAdventure(steveRoom) && steveRoom !== ghostLocation) {
        const fightingSteve = steveRoom === $location`The Haunted Laboratory`;
        // Technically drops 500 meat, but that's close enough for me.
        if (fightingSteve) embezzlerPrep();
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
        return fightingSteve;
      }
      return false;
    },
  },
  {
    name: "Proton Ghost",
    available: () =>
      sober() &&
      have($item`protonic accelerator pack`) &&
      get("questPAGhost") !== "unstarted" &&
      !!get("ghostLocation"),
    perform: () => {
      const ghostLocation = get("ghostLocation");
      if (!ghostLocation) return false;
      freeFightPrep(
        new Requirement(
          ghostLocation === $location`The Icy Peak` ? ["Cold Resistance 5 min"] : [],
          {
            forceEquip: $items`protonic accelerator pack`,
          }
        )
      );
      adventureMacro(ghostLocation, Macro.ghostBustin());
      return get("questPAGhost") === "unstarted";
    },
  },
  {
    name: "Vote Wanderer",
    available: () =>
      sober() &&
      have($item`"I Voted!" sticker`) &&
      totalTurnsPlayed() % 11 === 1 &&
      get("lastVoteMonsterTurn") < totalTurnsPlayed() &&
      get("_voteFreeFights") < 3,
    perform: () => {
      freeFightPrep(new Requirement([], { forceEquip: $items`"I Voted!" sticker` }));
      adventureMacroAuto(determineDraggableZoneAndEnsureAccess(), Macro.basicCombat());
      return get("lastVoteMonsterTurn") === totalTurnsPlayed();
    },
  },
  {
    name: "Digitize Wanderer",
    available: () => Counter.get("Digitize Monster") <= 0,
    perform: () => {
      const isEmbezzler = get("_sourceTerminalDigitizeMonster") === embezzler;
      const start = get("_sourceTerminalDigitizeMonsterCount");

      const shouldGoUnderwater =
        isEmbezzler &&
        !get("_envyfishEggUsed") &&
        myLevel() >= 11 &&
        (getModifier("Adventure Underwater") ||
          waterBreathingEquipment.some((item) => have(item))) &&
        (getModifier("Underwater Familiar") ||
          familiarWaterBreathingEquipment.some((item) => have(item))) &&
        (have($effect`Fishy`) || (have($item`fishy pipe`) && !get("_fishyPipeUsed"))) &&
        !have($item`envyfish egg`) &&
        canAdventure($location`The Briny Deeps`);
      const targetLocation = shouldGoUnderwater
        ? $location`The Briny Deeps`
        : determineDraggableZoneAndEnsureAccess();

      isEmbezzler ? embezzlerPrep() : freeFightPrep();
      adventureMacroAuto(targetLocation, Macro.basicCombat());
      return get("_sourceTerminalDigitizeMonsterCount") !== start;
    },
  },
  {
    name: "Guaranteed Kramco",
    available: () => sober() && kramcoGuaranteed(),
    perform: () => {
      freeFightPrep(new Requirement([], { forceEquip: $items`Kramco Sausage-o-Matic™` }));
      adventureMacroAuto(determineDraggableZoneAndEnsureAccess(), Macro.basicCombat());
      return !kramcoGuaranteed();
    },
  },
  {
    name: "Void Monster",
    available: () =>
      sober() &&
      have($item`cursed magnifying glass`) &&
      get("cursedMagnifyingGlassCount") === 13 &&
      get("_voidFreeFights") < 5,
    perform: () => {
      freeFightPrep(new Requirement([], { forceEquip: $items`cursed magnifying glass` }));
      adventureMacroAuto(determineDraggableZoneAndEnsureAccess(), Macro.basicCombat());
      return get("cursedMagnifyingGlassCount") === 0;
    },
  },
  {
    name: "Envyfish Egg",
    available: () =>
      have($item`envyfish egg`) && get("envyfishMonster") === embezzler && !get("_envyfishEggUsed"),
    perform: () => {
      embezzlerPrep();
      withMacro(Macro.meatKill(), () => use($item`envyfish egg`), true);
      return get("_envyfishEggUsed");
    },
  },
  {
    name: "Map for Pills",
    available: () =>
      !sober() &&
      globalOptions.ascending &&
      clamp(myAdventures() - digitizedMonstersRemaining(), 1, myAdventures()) <=
        availableAmount($item`Map to Safety Shelter Grimace Prime`),
    perform: () => {
      const choiceToSet =
        availableAmount($item`distention pill`) <
        availableAmount($item`synthetic dog hair pill`) +
          availableAmount($item`Map to Safety Shelter Grimace Prime`)
          ? 1
          : 2;
      setChoice(536, choiceToSet);
      ensureEffect($effect`Transpondent`);
      use($item`Map to Safety Shelter Grimace Prime`);
      return true;
    },
  },
  {
    name: "Barf",
    available: () => true,
    perform: () => {
      useFamiliar(barfFamiliar());
      const lubing = get("dinseyRollercoasterNext") && have($item`lube-shoes`);
      meatOutfit(
        false,
        lubing ? new Requirement([], { forceEquip: $items`lube-shoes` }) : undefined
      );
      adventureMacroAuto(
        $location`Barf Mountain`,
        Macro.meatKill(),
        Macro.if_(
          `(monsterid ${$monster`Knob Goblin Embezzler`.id}) && !gotjump && !(pastround 2)`,
          Macro.meatKill()
        ).abort()
      );
      completeBarfQuest();
      return true;
    },
  },
];

export default function barfTurn(): void {
  if (SourceTerminal.have()) SourceTerminal.educate([$skill`Extract`, $skill`Digitize`]);

  tryFillLatte();
  meatMood().execute(estimatedTurns());
  safeRestore();

  const startTurns = totalTurnsPlayed();
  for (const { name, available, perform } of turns) {
    if (available()) {
      const success = perform();
      if (success) {
        if (
          totalTurnsPlayed() - startTurns === 1 &&
          get("lastEncounter") === "Knob Goblin Embezzler"
        ) {
          embezzlerLog.initialEmbezzlersFought++;
          embezzlerLog.sources.push(name === "Digitize" ? name : "Unknown Source");
        }
        return;
      }
    }
  }
  throw new Error("Somehow failed to find anything to do!");
}
