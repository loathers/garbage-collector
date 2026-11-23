import { print, toItem } from "kolmafia";
import { DistributiveOmit, HIGHLIGHT, setChoice } from "../../lib";
import { logMessage } from "../../log";
import { get, getStep, QuestState } from "libram";
import { Macro } from "../../combat";
import { GarboStrategy } from "../../combatStrategy";
import { freeFightOutfit } from "../../outfit/free";
import { MappingTask } from "../engine";
import { AdventureContext } from "../context";

export type GarboFreeFightTask<Context = unknown> = DistributiveOmit<
  Extract<MappingTask<Context>, { combat: GarboStrategy<Context> }>,
  "ready" | "completed"
> & {
  ready?: () => boolean;
  completed: () => boolean;
  combatCount: () => number;
  tentacle: boolean; // if a tentacle fight can follow
};

const DEFAULT_FREE_FIGHT_TASK = {
  // GarboTask
  combat: new GarboStrategy(() => Macro.basicCombat()),
  spendsTurn: false,
  // GarboFreeFightTask
  combatCount: () => 1,
};

type FreeFightFragment<Context, Task = GarboFreeFightTask<Context>> =
  Task extends GarboFreeFightTask<Context>
    ? Omit<Task, keyof typeof DEFAULT_FREE_FIGHT_TASK | "outfit"> &
        Partial<Pick<Task, keyof typeof DEFAULT_FREE_FIGHT_TASK | "outfit">>
    : never;

export function freeFightTask<
  Context extends AdventureContext = AdventureContext,
>(fragment: FreeFightFragment<Context>) {
  const outfit = ({ adventure }: AdventureContext) =>
    freeFightOutfit({}, adventure);
  return { outfit, ...DEFAULT_FREE_FIGHT_TASK, ...fragment };
}

export function prepareParty() {
  const quest = get("_questPartyFairQuest");

  if (quest === "food") {
    if (getStep("_questPartyFair") === QuestState.STARTED) {
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
    if (getStep("_questPartyFair") === QuestState.STARTED) {
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
