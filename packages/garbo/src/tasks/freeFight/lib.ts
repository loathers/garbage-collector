import { print, toItem } from "kolmafia";
import { HIGHLIGHT, questStep, setChoice } from "../../lib";
import { logMessage } from "../../log";
import { Delayed, get, undelay } from "libram";
import { Macro } from "../../combat";
import { GarboStrategy } from "../../combatStrategy";
import { AdventureArgument } from "../../garboWanderer";
import { freeFightOutfit } from "../../outfit/free";
import { MappingTask } from "../engine";

export type GarboFreeFightTask = Extract<
  MappingTask,
  { combat: GarboStrategy }
> & {
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

export function freeFightTask(
  fragment: Omit<
    GarboFreeFightTask,
    keyof typeof DEFAULT_FREE_FIGHT_TASK | "outfit"
  > &
    Partial<
      Pick<GarboFreeFightTask, keyof typeof DEFAULT_FREE_FIGHT_TASK | "outfit">
    > & {
      adventure: Delayed<AdventureArgument>;
    },
) {
  const outfit = () => freeFightOutfit({}, undelay(fragment.adventure)); // Todo: account for wanderers
  const fullTask = { outfit, ...DEFAULT_FREE_FIGHT_TASK, ...fragment };
  // Give us some padding
  return {
    ...fullTask,
    limit: fullTask.limit ?? { skip: 5 + fullTask.combatCount() },
  };
}

export function prepareParty() {
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
