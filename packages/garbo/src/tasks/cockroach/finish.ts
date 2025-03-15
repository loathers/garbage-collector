import { Quest } from "grimoire-kolmafia";
import {
  $effect,
  $items,
  $location,
  $skill,
  get,
  have,
  questStep,
} from "libram";
import { GarboStrategy, Macro } from "../../combat";
import { targetMeat, unignoreBeatenUp } from "../../lib";
import { meatMood } from "../../mood";
import { meatTargetOutfit } from "../../outfit";
import { potionSetup } from "../../potions";
import { copyTargetCount } from "../../target";
import { GarboTask } from "../engine";
import { doingGregFight } from "../../resources";
import { useSkill } from "kolmafia";
import { DebuffPlanner } from "./debuffplanner";

export const CockroachFinish: Quest<GarboTask> = {
  name: "Setup Cockroach Target",
  ready: () =>
    get("pirateRealmUnlockedAnemometer") &&
    doingGregFight() &&
    questStep("_questPirateRealm") >= 5,
  completed: () => get("_lastPirateRealmIsland") === $location`Trash Island`,
  tasks: [
    {
      name: "Final Island Encounter (Island 1 (Giant Giant Crab))",
      ready: () =>
        questStep("_questPirateRealm") === 5 &&
        get("_lastPirateRealmIsland") === $location`Crab Island`,
      completed: () => questStep("_questPirateRealm") > 5,
      prepare: DebuffPlanner.checkAndFixOvercapStats,
      do: $location`Crab Island`,
      outfit: () => {
        const outfit = meatTargetOutfit(
          {
            modifier: ["-Muscle", "-Mysticality", "-Moxie"],
            equip: $items`PirateRealm eyepatch`,
            avoid: $items`Roman Candelabra`,
          },
          $location`Crab Island`,
        );
        outfit.beforeDress(
          () => meatMood(false, targetMeat()).execute(copyTargetCount()),
          () => potionSetup(false),
        );
        return outfit;
      },
      choices: { 1385: 1, 1368: 1 }, // Take cocoa of youth, fight crab
      combat: new GarboStrategy(() => Macro.delevel().meatKill()),
      limit: { tries: 1 },
      spendsTurn: true,
    },
    {
      name: "Choose Trash Island",
      ready: () => questStep("_questPirateRealm") === 6,
      completed: () => questStep("_questPirateRealm") > 6,
      prepare: () => DebuffPlanner.checkAndFixOvercapStats(),
      do: $location`Sailing the PirateRealm Seas`,
      outfit: {
        equip: $items`PirateRealm eyepatch`,
        avoid: $items`Roman Candelabra`,
      },
      choices: { 1353: 5 }, // Trash Island
      limit: { tries: 1 },
      spendsTurn: false,
      combat: new GarboStrategy(() =>
        Macro.abortWithMsg("Hit a combat while sailing the high seas!"),
      ),
    },
    {
      name: "Stop Being Beaten Up",
      completed: () => !have($effect`Beaten Up`),
      do: () => useSkill($skill`Tongue of the Walrus`),
      spendsTurn: false,
      post: unignoreBeatenUp,
    },
  ],
};
