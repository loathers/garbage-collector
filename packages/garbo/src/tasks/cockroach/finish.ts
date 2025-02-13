import { Quest } from "grimoire-kolmafia";
import { $items, $location, get, questStep } from "libram";
import { GarboStrategy, Macro } from "../../combat";
import { targetMeat } from "../../lib";
import { meatMood } from "../../mood";
import { meatTargetOutfit } from "../../outfit";
import { potionSetup } from "../../potions";
import { copyTargetCount } from "../../target";
import { GarboTask } from "../engine";
import { checkAndFixOvercapStats } from "./lib";
import { doingGregFight } from "../../resources";

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
      prepare: () => {
        meatMood(true, targetMeat()).execute(copyTargetCount());
        potionSetup(false);
        checkAndFixOvercapStats();
      },
      do: $location`Crab Island`,
      outfit: () => {
        const spec = meatTargetOutfit({
          modifier: ["20 Meat Drop"],
          equip: $items`PirateRealm eyepatch`,
          avoid: $items`Roman Candelabra`,
        });
        return spec;
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
      prepare: () => checkAndFixOvercapStats(),
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
  ],
};
